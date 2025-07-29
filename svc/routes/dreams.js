/**
 * Dream API Routes
 * RESTful endpoints for Dream CRUD operations with authentication
 * All operations are scoped to the authenticated Dreamer
 */

const express = require('express');
const crypto = require('crypto');
const Dream = require('../models/Dream');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Apply authentication middleware to all dream routes
router.use(authenticateToken);

// GET /api/dreams - Get all dreams for authenticated dreamer
router.get('/', async (req, res) => {
  try {
    const dreams = await Dream.findByDreamer(req.dreamerId, {
      sort: { updatedAt: -1 } // Most recently updated first
    });
    
    const frontendDreams = dreams.map(dream => dream.toFrontend());
    
    res.json({
      success: true,
      data: frontendDreams,
      count: frontendDreams.length
    });
  } catch (error) {
    console.error('Get dreams error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve dreams',
      details: error.message
    });
  }
});

// GET /api/dreams/:slug - Get dream by slug for authenticated dreamer
router.get('/:slug', async (req, res) => {
  try {
    const dream = await Dream.findByDreamerAndSlug(req.dreamerId, req.params.slug);
    
    if (!dream) {
      return res.status(404).json({
        success: false,
        error: 'Dream not found',
        slug: req.params.slug
      });
    }
    
    res.json({
      success: true,
      data: dream.toFrontend()
    });
  } catch (error) {
    console.error('Get dream by slug error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve dream',
      details: error.message
    });
  }
});

// POST /api/dreams - Create new dream for authenticated dreamer
router.post('/', async (req, res) => {
  try {
    const dreamData = req.body;
    
    // Validation
    if (!dreamData.id || !dreamData.title) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: id and title are required'
      });
    }
    
    let dreamId = dreamData.id;
    let newIdGenerated = false;
    
    // Check if dream with this ID already exists for any dreamer
    const existingDream = await Dream.findById(dreamData.id);
    if (existingDream) {
      // Generate new ID
      dreamId = crypto.randomUUID();
      newIdGenerated = true;
    }
    
    // Check if dreamer already has a dream with this title
    const existingSlugDream = await Dream.findByDreamerAndSlug(
      req.dreamerId, 
      dreamData.slug || dreamData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
    );
    
    if (existingSlugDream) {
      return res.status(409).json({
        success: false,
        error: 'You already have a dream with this title',
        field: 'title',
        existingDream: existingSlugDream.toFrontend() // Return existing dream for easy redirect
      });
    }
    
    // Create dream for authenticated dreamer with (possibly new) ID
    const dreamDataWithId = { ...dreamData, id: dreamId };
    const dream = Dream.createForDreamer(dreamDataWithId, req.dreamerId);
    const savedDream = await dream.save();
    
    // Update dreamer's dream count
    req.dreamer.dreamCount = await Dream.countByDreamer(req.dreamerId);
    await req.dreamer.save();
    
    const response = {
      success: true,
      data: savedDream.toFrontend(),
      message: 'Dream created successfully'
    };
    
    // Include newId if we generated one
    if (newIdGenerated) {
      response.newId = dreamId;
    }
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Create dream error:', error);
    
    // Handle duplicate slug error (should be rare due to pre-check)
    if (error.code === 11000 && error.keyPattern?.slug) {
      return res.status(409).json({
        success: false,
        error: 'You already have a dream with this title',
        field: 'title'
      });
    }
    
    res.status(400).json({
      success: false,
      error: 'Failed to create dream',
      details: error.message
    });
  }
});

// PUT /api/dreams/:slug - Update dream by slug for authenticated dreamer
router.put('/:slug', async (req, res) => {
  try {
    const dreamData = req.body;
    
    // Find existing dream owned by authenticated dreamer
    const existingDream = await Dream.findByDreamerAndSlug(req.dreamerId, req.params.slug);
    
    if (!existingDream) {
      return res.status(404).json({
        success: false,
        error: 'Dream not found',
        slug: req.params.slug
      });
    }
    
    // If title is being changed, check for slug conflicts
    if (dreamData.title && dreamData.title !== existingDream.title) {
      const newSlug = dreamData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      const conflictingDream = await Dream.findByDreamerAndSlug(req.dreamerId, newSlug);
      
      if (conflictingDream && conflictingDream._id !== existingDream._id) {
        return res.status(409).json({
          success: false,
          error: 'You already have a dream with this title',
          field: 'title',
          existingDream: conflictingDream.toFrontend() // Return existing dream for easy redirect
        });
      }
    }
    
    // Update fields
    if (dreamData.title !== undefined) existingDream.title = dreamData.title;
    if (dreamData.vision !== undefined) existingDream.vision = dreamData.vision;
    if (dreamData.goals !== undefined) existingDream.goals = dreamData.goals;
    if (dreamData.roleModels !== undefined) existingDream.roleModels = dreamData.roleModels;
    
    const updatedDream = await existingDream.save();
    
    res.json({
      success: true,
      data: updatedDream.toFrontend(),
      message: 'Dream updated successfully'
    });
  } catch (error) {
    console.error('Update dream error:', error);
    
    // Handle duplicate slug error
    if (error.code === 11000 && error.keyPattern?.slug) {
      return res.status(409).json({
        success: false,
        error: 'You already have a dream with this title',
        field: 'title'
      });
    }
    
    res.status(400).json({
      success: false,
      error: 'Failed to update dream',
      details: error.message
    });
  }
});

// DELETE /api/dreams/:slug - Delete dream by slug for authenticated dreamer
router.delete('/:slug', async (req, res) => {
  try {
    const dream = await Dream.findOneAndDelete({
      dreamerId: req.dreamerId,
      slug: req.params.slug
    });
    
    if (!dream) {
      return res.status(404).json({
        success: false,
        error: 'Dream not found',
        slug: req.params.slug
      });
    }
    
    // Update dreamer's dream count
    req.dreamer.dreamCount = await Dream.countByDreamer(req.dreamerId);
    await req.dreamer.save();
    
    res.json({
      success: true,
      data: dream.toFrontend(),
      message: 'Dream deleted successfully'
    });
  } catch (error) {
    console.error('Delete dream error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete dream',
      details: error.message
    });
  }
});

// GET /api/dreams/:slug/stats - Get statistics for a specific dream
router.get('/:slug/stats', async (req, res) => {
  try {
    const dream = await Dream.findByDreamerAndSlug(req.dreamerId, req.params.slug);
    
    if (!dream) {
      return res.status(404).json({
        success: false,
        error: 'Dream not found',
        slug: req.params.slug
      });
    }
    
    // For now, just return basic stats
    // Future: Add goals count, completion rates, etc.
    const stats = {
      goalsCount: dream.goals.length,
      roleModelsCount: dream.roleModels.length,
      createdAt: dream.createdAt,
      lastUpdated: dream.updatedAt,
      ageInDays: Math.floor((new Date() - dream.createdAt) / (1000 * 60 * 60 * 24))
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get dream stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dream statistics',
      details: error.message
    });
  }
});

module.exports = router;