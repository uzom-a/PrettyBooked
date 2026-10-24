// Turns database errors into messages people can read. Our own rules
// (raise exception in the migrations) are already written for people.
export function friendlyError(err) {
  if (!err) return ''
  if (err.code === 'P0001') return err.message
  if (err.code === '42501') return "You don't have permission to do that."
  if (err.code === '23505') return 'That already exists.'
  if (err.code === '23514') return 'Some of the details are not valid.'
  return 'Something went wrong. Please try again.'
}
