/**
 * RoleModel - People who have accomplished similar things to the user's Dream
 * Serves as inspiration and guidance for achieving the Dream
 */

export const createRoleModel = ({
  name = '',
  description = '',
  accomplishments = [],
  resources = [], // Links, books, videos, etc.
  relevance = '' // How they relate to the user's dream
}) => {
  return {
    id: crypto.randomUUID(),
    name,
    description,
    accomplishments,
    resources,
    relevance,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const updateRoleModel = (roleModel, updates) => {
  return {
    ...roleModel,
    ...updates,
    updatedAt: new Date().toISOString()
  };
};

export const addAccomplishment = (roleModel, accomplishment) => {
  return {
    ...roleModel,
    accomplishments: [...roleModel.accomplishments, accomplishment],
    updatedAt: new Date().toISOString()
  };
};

export const addResource = (roleModel, resource) => {
  return {
    ...roleModel,
    resources: [...roleModel.resources, resource],
    updatedAt: new Date().toISOString()
  };
};

export const createResource = ({
  title = '',
  url = '',
  type = '', // 'book', 'video', 'article', 'website', etc.
  description = ''
}) => {
  return {
    id: crypto.randomUUID(),
    title,
    url,
    type,
    description,
    createdAt: new Date().toISOString()
  };
};