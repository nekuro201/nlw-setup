import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from "./lib/prisma"
import dayjs from 'dayjs'

export async function appRoutes(app: FastifyInstance){

  /**
   * Método HTTP: Get, Post, Put, Patch, Delete
   */

  /**
   * request.body:
   *  geralmente onde fica as informações para a criação de um novo recurso
   * 
   * request.params:
   *  são os parametros na rota por exemplo na rota /habits/4124, seria o 4124
   * 
   * request.query: 
   *  são os parametros com ponto de interrogação como na rota /habits?page=1, 
   *  usado para filtro por exemplo
   */
  
  app.post('/habits', async (request) => {
    
    // zod valida e retorna tipagem dos dados do frontend
    const createHabitBody = z.object({
      title: z.string(),
      weekDays: z.array(
        z.number().min(0).max(6) // [0, 1, 2] Doming, Segundo, Terça
      )
    })

    // validar antes se esses dados existem na requisição
    const { title, weekDays } = createHabitBody.parse(request.body)

    const today = dayjs().startOf('day').toDate()

    /**
     * observação: no bando de dados sempre será o horário com utc-3
     * logo, se for salvo no japão, terá uma diferença de 15 horas
     * exemplo: 2023-01-17T15:00:00.000Z
     */

    await prisma.habit.create({
      data: {
        title,
        created_at: today,
        weekDays: {
          create: weekDays.map(weekDay => {
            return {
              week_day: weekDay,
            }
          })
        }
      }
    })
    
  })

  app.get('/day', async(request) => {
    
    // por padrao, ele nao vem no formato date(), logo precisa ser convertido de string para date
    const getDayParams = z.object({
      date: z.coerce.date() // coerce faz um return new Date(date)
    })

    //localhost:3333/day?date=2023-01-17T15:00:00.000Z
    const { date } = getDayParams.parse(request.query)

    const parsedDate = dayjs(date).startOf('day')
    const weekDay = parsedDate.get('day')
    //console.log(parsedDate.toDate())

    const possibleHabits = await prisma.habit.findMany({
      where: {
        created_at: {
          lte: date,
        },
        weekDays: {
          some: {
            week_day: weekDay,
          }
        }
      }
    })

    const day = await prisma.day.findUnique({
      where: {
        date: parsedDate.toDate(),
      },
      include: {
        dayHabits: true,
      }
    })

    const completedHabits = day?.dayHabits.map(dayHabit => {
      return dayHabit.habit_id
    }) ?? []

    return {
      possibleHabits,
      completedHabits,
    }
  })

  app.patch('/habits/:id/toggle', async (request) => {
    // rota para marcar ou desmarcar como completo

    const toggleHabitParams = z.object({
      id: z.string().uuid(),
    })

    // route pram => parâmetro de identificação
    const { id } = toggleHabitParams.parse(request.params)

    const today = dayjs().startOf('day').toDate()
    console.log(dayjs())

    let day = await prisma.day.findUnique({
      where: {
        date: today,
      }
    })

    if(!day) {
      day = await prisma.day.create({
        data: {
          date: today,
        }
      })
    }

    const dayHabit = await prisma.dayHabit.findUnique({
      where: {
        day_id_habit_id: {
          day_id: day.id,
          habit_id: id,
        }
      }
    })

    if(dayHabit) {
      // Desmarcar como completo
      await prisma.dayHabit.delete({
        where: {
          id: dayHabit.id,
        }
      })
    }
    else{
      // Completar o hábito
      await prisma.dayHabit.create({
        data: {
          day_id: day.id,
          habit_id: id,
        }
      })
    }

  })

  app.get('/summary', async () => {
    // exemplo: [ { date: 17/01, amount: 5, completed: 1 }, {}, {} ]

    //D => whiles

    const summary = await prisma.$queryRaw`
      SELECT 
        D.id, 
        D.date,
        strftime('%w', D.date/1000.0, 'unixepoch') week_day,
        (
          SELECT 
            cast(count(*) as float)
          FROM day_habits DH
          WHERE DH.day_id = D.id
        ) as completed,
        (
          SELECT
            cast(count(*) as float)
          FROM habit_week_days HDW
          JOIN habits H
            ON H.id = HDW.habit_id
          WHERE
            HDW.week_day = cast(strftime('%w', D.date/1000.0, 'unixepoch') as int)
            AND H.created_at <= D.date
        ) as amount
      FROM days D
    `

    return summary
  })
}
