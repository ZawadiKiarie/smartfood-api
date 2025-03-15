const jwt = require("jsonwebtoken");
const redis = require("redis");

// setup Redis:
const redisClient = redis.createClient({
  url: process.env.REDIS_URI,
});
redisClient.on("error", (err) => console.log("Redis Client Error", err));

(async () => {
  await redisClient.connect();
})();

const handleSignin = (db, bcrypt, req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return Promise.reject("incorrect form submission"); //we use promise so that the rejected promise can be caught in the signInAuthenitcation as an error and give a response there instead of here. Because we want the function that handles our endpoint to be the one that returns responses
  }
  return db
    .select("email", "hash")
    .from("login")
    .where("email", "=", email)
    .then((data) => {
      const isValid = bcrypt.compareSync(password, data[0].hash);
      if (isValid) {
        return db
          .select("*")
          .from("users")
          .where("email", "=", email)
          .then((user) => user[0]) //we don't want to return a response as it being handled in signInAuthentication.
          .catch((err) => Promise.reject("unable to get user"));
      } else {
        Promise.reject("wrong credentials");
      }
    })
    .catch((err) => Promise.reject("wrong credentials"));
};

const getAuthTokenId = async (req, res) => {
  try {
    const { authorization } = req.headers;
    const reply = await redisClient.get(authorization);
    return res.json({ id: reply });
  } catch (err) {
    return res.status(400).json("Unauthorized");
  }
};

const signToken = (email) => {
  const jwtPayload = { email }; //this is the data in token found when you decode it. don't use sensitive info in jwt token - email or id -> useful. we use this data(user's email) to sign the token
  return jwt.sign(jwtPayload, "JWT_SECRET", { expiresIn: "2 days" }); //we return jwt token here by signing it with payload(user data that is not sensitive) and a secret that should be in env variable
};

const setToken = async (key, value) => {
  try {
    await redisClient.set(key, value);
    return Promise.resolve();
  } catch (err) {
    console.log("Error setting token in redis:", err);
    return Promise.reject(err);
  }
};

const createSessions = async (user) => {
  // create JWT and return user data
  try {
    const { email, id } = user;
    const token = signToken(email);
    await setToken(token, id);
    return { success: "true", userId: id, token };
  } catch (err) {
    console.log("error creating session:", err);
  }
};

//whatever handles the end point should be the one that returns a response.
const signInAuthentication = (db, bcrypt) => (req, res) => {
  const { authorization } = req.headers;

  return authorization
    ? getAuthTokenId(req, res)
    : handleSignin(db, bcrypt, req, res)
        .then((data) => {
          if (data.id && data.email) {
            return createSessions(data);
          }
          throw new Error("Invalid credentials");
        })
        .then((session) => {
          console.log("session created:", session);
          res.json(session);
        })
        .catch((err) => res.status(400).json(err));
};

module.exports = {
  signInAuthentication,
  redisClient,
  createSessions,
};
