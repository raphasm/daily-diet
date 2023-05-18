import { Knex } from 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    user: {
      id: string
      name: string
      email: string
      age: string
      created_at: string
      session_id?: string
    }

    meals: {
      id: string
      snack: string
      description: string
      date: string
      time: string
      isOnDiet: string
      created_at: string
      session_id?: string
      user_id: string
    }
  }
}
