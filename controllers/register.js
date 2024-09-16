const saltRounds = 10;

const handleRegister = (db, bcrypt) => (req, res) => {
  const {email, name, password} = req.body;
  if (!email || !name || !password) {
    return res.status(400).json('Incorrect form submission')
  }//also validate against input values

  if((!/\S+@\S+\.\S+/.test(email)) || (password.length < 6) || (name.length < 1)) {
    return res.status(400).json('Invalid form submission')
  }

  const hash = bcrypt.hashSync(password, saltRounds);

  db.transaction(trx => {
    trx('users')
      .returning('*')//returning the users row
      .insert({
        name: name,
        email: email,
        date_joined: new Date
      })
      .then(user => {
        return trx('login')
          .returning('user_id')
          .insert({
            hash: hash,
            user_id: user[0].id
          })
          .then(() => {
            res.json(user[0])
          });
      })
      .then(trx.commit)
      .catch(trx.rollback);
  })
  .catch(err => {
    res.status(400).json('User Account already exists')
  });
}

module.exports = {
  handleRegister: handleRegister
}