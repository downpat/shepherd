export const createDreamer = ({
  type, //normal, intro, anonymous
}) => {
  return {
    type,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

export const updateDreamer = (dreamer, updates) => {
  return {
    ...dreamer,
    ...updates,
    updatedAt: new Date().toISOString()
  }
}
