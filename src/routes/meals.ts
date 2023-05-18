import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { randomUUID } from 'crypto'
import { checkUsersExists } from '../middlewares/check-users-exists'
import { VerifyUserAndMealsIdExists } from '../errors/VerifyUserAndMealsIdExists'

export async function meals(app: FastifyInstance) {
  // Criação das refeições
  app.post('/', { preHandler: [checkUsersExists] }, async (request, reply) => {
    const mealsBodySchema = z.object({
      snack: z.string(),
      description: z.string(),
      date: z.string().length(10),
      time: z.string().length(5),
      isOnDiet: z.enum(['sim', 'não']),
    })

    const { sessionId } = request.cookies

    const { snack, description, date, time, isOnDiet } = mealsBodySchema.parse(
      request.body,
    )

    const [user] = await knex('user').where('session_id', sessionId).select('*')

    const userId = user.id

    await knex('meals').insert({
      id: randomUUID(),
      user_id: userId,
      snack,
      description,
      date,
      time,
      isOnDiet,
    })

    return reply.status(201).send()
  })

  // listagem das refeições
  app.get('/', { preHandler: [checkUsersExists] }, async (request, reply) => {
    const { sessionId } = request.cookies

    const [user] = await knex('user').where('session_id', sessionId).select('*')

    const userId = user.id

    const meals = await knex('meals').where({
      user_id: userId,
    })

    return {
      meals,
    }
  })

  // Listagem de uma única refeição
  app.get(
    '/:id',
    { preHandler: [checkUsersExists] },
    async (request, reply) => {
      const getIdParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getIdParamsSchema.parse(request.params)

      const { sessionId } = request.cookies

      const [user] = await knex('user')
        .where('session_id', sessionId)
        .select('id')

      const userId = user.id

      const meals = await knex('meals')
        .where({
          user_id: userId,
          id,
        })
        .first()

      if (!meals?.id) {
        reply.status(404)
        throw new VerifyUserAndMealsIdExists()
      }

      return {
        meals,
      }
    },
  )

  // Atualização da refeição
  app.put(
    '/:id',
    { preHandler: [checkUsersExists] },
    async (request, reply) => {
      const getIdParamsSchema = z.object({
        id: z.string().uuid(),
      })
      const getMealsParamsSchema = z.object({
        snack: z.string().optional(),
        description: z.string().optional(),
        date: z.string().length(10).optional(),
        time: z.string().length(5).optional(),
        isOnDiet: z.enum(['sim', 'não']).optional(),
      })

      const { id } = getIdParamsSchema.parse(request.params)

      const { snack, description, date, time, isOnDiet } =
        getMealsParamsSchema.parse(request.body)

      const { sessionId } = request.cookies

      const [user] = await knex('user')
        .where('session_id', sessionId)
        .select('id')

      const userId = user.id

      const verifyMealsAndUserId = await knex('meals')
        .where({
          id,
          user_id: userId,
        })
        .first()

      if (!verifyMealsAndUserId) {
        reply.status(404)
        throw new VerifyUserAndMealsIdExists()
      }

      await knex('meals').where({ id }).update({
        snack,
        description,
        date,
        time,
        isOnDiet,
      })

      return reply.status(201).send()
    },
  )

  // Deletando uma refeição
  app.delete(
    '/:id',
    { preHandler: [checkUsersExists] },
    async (request, reply) => {
      const getIdParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getIdParamsSchema.parse(request.params)

      const { sessionId } = request.cookies

      const [user] = await knex('user').where('session_id', sessionId).select()

      const userId = user.id

      const verifyMealsAndUserId = await knex('meals')
        .where({
          id,
          user_id: userId,
        })
        .first()

      if (!verifyMealsAndUserId) {
        reply.status(404)
        throw new VerifyUserAndMealsIdExists()
      }

      await knex('meals').where({ id }).del()

      reply.status(201).send()
    },
  )

  // Pegando as métricas do usuário
  app.get(
    '/metrics',
    { preHandler: [checkUsersExists] },
    async (request, reply) => {
      const { sessionId } = request.cookies

      const [user] = await knex('user')
        .where('session_id', sessionId)
        .select('id')

      const userId = user.id

      const metrics = await knex('meals')
        .count('id', {
          as: 'refeições registradas',
        })
        .where({
          user_id: userId,
        })

      const offDiet = await knex('meals')
        .count('id', {
          as: 'refeições fora da dieta',
        })
        .where({
          user_id: userId,
          isOnDiet: 'não',
        })

      const onDiet = await knex('meals')
        .count('id', {
          as: 'refeições dentro da dieta',
        })
        .where({
          user_id: userId,
          isOnDiet: 'sim',
        })

      return {
        metrics,
        offDiet,
        onDiet,
      }
    },
  )
}
