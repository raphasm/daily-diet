import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { randomUUID } from 'crypto'

export async function user(app: FastifyInstance) {
  // Criação e validação do usuário
  app.post('/', async (request, reply) => {
    const userRequestBodyParams = z.object({
      name: z.string(),
      email: z.string(),
      age: z.string(),
    })

    const { name, age, email } = userRequestBodyParams.parse(request.body)

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 dias
      })
    }

    await knex('user').insert({
      id: randomUUID(),
      name,
      email,
      age,
      session_id: sessionId,
    })

    return reply.status(201).send()
  })
}
