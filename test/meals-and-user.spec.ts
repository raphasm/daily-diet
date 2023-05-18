import { it, beforeAll, afterAll, describe, beforeEach, expect } from 'vitest'
import { execSync } from 'node:child_process'
import request from 'supertest'
import { app } from '../src/app'

describe('Meals and User routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('should be able to create a new user', async () => {
    const userRequest = await request(app.server).post('/user').send({
      name: 'John Doe',
      email: 'jhondoexemple@hotmail.com',
      age: '22',
    })

    expect(userRequest.statusCode).toEqual(201)
  })

  it('should be able to identify a user between of the requests', async () => {
    const userRequest = await request(app.server)
      .post('/user')
      .send({
        name: 'John Doe',
        email: 'jhondoexemple@hotmail.com',
        age: '22',
      })
      .expect(201)

    const cookies = userRequest.headers['set-cookie']

    expect(cookies).toEqual([expect.any(String)])
  })

  it('should be able to create a new meals', async () => {
    const userRequest = await request(app.server).post('/user').send({
      name: 'John Doe',
      email: 'jhondoexemple@hotmail.com',
      age: '22',
    })

    const cookies = userRequest.get('Set-Cookie')

    const mealsRequest = await request(app.server)
      .post('/meals')
      .set('Cookie', cookies)
      .send({
        user_id: '1',
        snack: 'Picanha na chapa',
        description: 'picanha temperada na chapa',
        date: '05/05/2023',
        time: '14:00',
        isOnDiet: 'não',
      })

    expect(mealsRequest.statusCode).toEqual(201)
  })

  it('should be able to list all meals', async () => {
    const userRequest = await request(app.server).post('/user').send({
      name: 'John Doe',
      email: 'jhondoexemple@hotmail.com',
      age: '22',
    })

    const cookies = userRequest.get('Set-Cookie')

    await request(app.server).post('/meals').set('Cookie', cookies).send({
      user_id: '1',
      snack: 'Picanha na chapa',
      description: 'picanha temperada na chapa',
      date: '05/05/2023',
      time: '14:00',
      isOnDiet: 'não',
    })

    await request(app.server).post('/meals').set('Cookie', cookies).send({
      user_id: '2',
      snack: 'batata doce',
      description: 'batata doce com frango',
      date: '06/05/2023',
      time: '12:00',
      isOnDiet: 'sim',
    })

    const listMeals = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)
      .expect(200)

    expect(listMeals.body.meals).toHaveLength(2)
  })

  it('should be able to get a unique meal', async () => {
    const userRequest = await request(app.server).post('/user').send({
      name: 'John Doe',
      email: 'jhondoexemple@hotmail.com',
      age: '22',
    })

    const cookies = userRequest.get('Set-Cookie')

    await request(app.server).post('/meals').set('Cookie', cookies).send({
      snack: 'Picanha na chapa',
      description: 'picanha temperada na chapa',
      date: '05/05/2023',
      time: '14:00',
      isOnDiet: 'não',
    })

    await request(app.server).post('/meals').set('Cookie', cookies).send({
      snack: 'batata doce',
      description: 'batata doce com frango',
      date: '06/05/2023',
      time: '12:00',
      isOnDiet: 'sim',
    })

    const listMeals = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)

    const listOneMeal = listMeals.body.meals[1].id

    const getMealsById = await request(app.server)
      .get(`/meals/${listOneMeal}`)
      .set('Cookie', cookies)
      .expect(200)

    expect(getMealsById.body.meals).toEqual(
      expect.objectContaining({
        snack: 'batata doce',
        description: 'batata doce com frango',
        date: '06/05/2023',
        time: '12:00',
        isOnDiet: 'sim',
      }),
    )
  })

  it('should me able to edit a specific meal', async () => {
    const userRequest = await request(app.server).post('/user').send({
      name: 'John Doe',
      email: 'jhondoexemple@hotmail.com',
      age: '22',
    })

    const cookies = userRequest.get('Set-Cookie')

    await request(app.server).post('/meals').set('Cookie', cookies).send({
      snack: 'Picanha na chapa',
      description: 'picanha temperada na chapa',
      date: '05/05/2023',
      time: '14:00',
      isOnDiet: 'não',
    })

    const firstMealRequest = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)

    const mealId = firstMealRequest.body.meals[0].id

    await request(app.server)
      .put(`/meals/${mealId}`)
      .send({
        snack: 'pastel',
        description: 'pastel de frango',
        date: '06/05/2023',
        time: '18:00',
        isOnDiet: 'não',
      })
      .set('Cookie', cookies)
      .expect(201)

    const secondMealRequest = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)

    expect(secondMealRequest.body.meals).toEqual([
      expect.objectContaining({
        snack: 'pastel',
        description: 'pastel de frango',
        date: '06/05/2023',
        time: '18:00',
        isOnDiet: 'não',
      }),
    ])
  })

  it('should be able to delete a meal', async () => {
    const userRequest = await request(app.server).post('/user').send({
      name: 'John Doe',
      email: 'jhondoexemple@hotmail.com',
      age: '22',
    })

    const cookies = userRequest.get('Set-Cookie')

    await request(app.server).post('/meals').set('Cookie', cookies).send({
      snack: 'Picanha na chapa',
      description: 'picanha temperada na chapa',
      date: '05/05/2023',
      time: '14:00',
      isOnDiet: 'não',
    })

    const firstMealRequest = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)

    const mealId = firstMealRequest.body.meals[0].id

    await request(app.server)
      .delete(`/meals/${mealId}`)
      .set('Cookie', cookies)
      .expect(201)

    const secondMealRequest = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)

    expect(secondMealRequest.body.meals).toEqual([])
  })

  it('should be able to get metrics of the user', async () => {
    const userRequest = await request(app.server).post('/user').send({
      name: 'John Doe',
      email: 'jhondoexemple@hotmail.com',
      age: '22',
    })

    const cookies = userRequest.get('Set-Cookie')

    await request(app.server).post('/meals').set('Cookie', cookies).send({
      snack: 'Picanha na chapa',
      description: 'picanha temperada na chapa',
      date: '05/05/2023',
      time: '14:00',
      isOnDiet: 'não',
    })

    await request(app.server).post('/meals').set('Cookie', cookies).send({
      snack: 'batata doce',
      description: 'batata doce temperada',
      date: '11/05/2023',
      time: '15:00',
      isOnDiet: 'sim',
    })

    await request(app.server).post('/meals').set('Cookie', cookies).send({
      snack: 'bolo',
      description: 'bolo de cenoura',
      date: '12/05/2023',
      time: '10:00',
      isOnDiet: 'não',
    })

    await request(app.server).post('/meals').set('Cookie', cookies).send({
      snack: 'macarrão',
      description: 'macarrão alho e oleo',
      date: '14/05/2023',
      time: '13:00',
      isOnDiet: 'sim',
    })
    await request(app.server).post('/meals').set('Cookie', cookies).send({
      snack: 'salada',
      description: 'salada com frango',
      date: '17/05/2023',
      time: '18:00',
      isOnDiet: 'sim',
    })

    await request(app.server).get('/meals').set('Cookie', cookies)

    const metrics = await request(app.server)
      .get('/meals/metrics')
      .set('Cookie', cookies)

    expect(metrics.body).toEqual(
      expect.objectContaining({
        metrics: [{ 'refeições registradas': 5 }],
        offDiet: [{ 'refeições fora da dieta': 2 }],
        onDiet: [{ 'refeições dentro da dieta': 3 }],
      }),
    )
  })
})
