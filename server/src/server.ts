// back-end API RESTful

import Fastify from 'fastify'
import cors from '@fastify/cors'
import { appRoutes } from './routes'

// rotas tipo express porem com mais performace
const app = Fastify()

// mecanismo de segurança que permite qual aplicacao frontend podera acessar essas rotas
app.register(cors, {
  origin: ['http://localhost:5173']
})

app.register(appRoutes)

app.listen({
  port: 3333,
  host: "0.0.0.0",
}).then(() => {
  console.log('HTTP Server running!')
})

// ORM: Prisma