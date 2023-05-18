export class VerifyUserAndMealsIdExists extends Error {
  constructor() {
    super('Invalid meals and user ID.')
  }
}
