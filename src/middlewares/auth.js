const jsonwebtoken = require('jsonwebtoken')
const passport = require('koa-passport')
const { Strategy: LocalStrategy } = require('passport-local')
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt')

const { getByUsernameOrEmailAndPassword, getById } = require('../users/model')

const signJwt = user =>
  jsonwebtoken.sign(JSON.stringify(user), process.env.APP_SECRET)

async function generateJwt (ctx, next, error, user) {
  if (error) {
    ctx.throw(401, error)
  } else if (!user) {
    ctx.throw(400, 'User not found.')
  } else {
    const token = await signJwt(user)
    ctx.state = { user, token }
    await next()
  }
}

async function validateJwt (ctx, next, error, user) {
  if (error) {
    ctx.throw(401, error)
  } else if (!user) {
    ctx.throw(400, 'Invalid token.')
  } else {
    ctx.state.user = user
    await next()
  }
}

passport.use(
  new LocalStrategy(
    {
      usernameField: 'username',
      passwordField: 'password'
    },
    async function (username, password, callback) {
      try {
        const user = await getByUsernameOrEmailAndPassword(username, password)
        callback(null, user)
      } catch (error) {
        callback(error)
      }
    }
  )
)

passport.use(
  new JwtStrategy(
    {
      secretOrKey: process.env.APP_SECRET,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
    },
    async function (payload, callback) {
      try {
        const user = await getById(payload.id)
        callback(null, user)
      } catch (error) {
        callback(error)
      }
    }
  )
)

const local = () => {
  return async (ctx, next) => {
    return passport.authenticate(['local'], { session: false }, async function (
      error,
      user
    ) {
      await generateJwt(ctx, next, error, user)
    })(ctx, next)
  }
}

const jwt = () => {
  return async (ctx, next) => {
    return passport.authenticate(['jwt'], { session: false }, async function (
      error,
      user
    ) {
      await validateJwt(ctx, next, error, user)
    })(ctx, next)
  }
}

module.exports = {
  local,
  jwt,
  generateJwt,
  validateJwt,
  signJwt
}
