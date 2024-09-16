const handleSignIn = (req, res, db, bcrypt) => {
  const { email, password } = req.body;
  if(!email || !password) {
    return res.status(400).json('incorrect form submission')
  }
  db.select('id').from('users')
    .where({ email })
    .then(data => {
      if(data.length) {//if email => user exists
        const userId = data[0].id;

        return db.select('hash').from('login')
          .where({ user_id: userId })
          .then(loginData => {//
            if (loginData.length) {//if there is pwd
              const isValid = bcrypt.compareSync(password, loginData[0].hash);
              if (isValid) {
                return db.select('*').from('users')
                  .where('id', '=', userId)
                  .then(user => {
                    res.json(user[0])
                  })
                  .catch(err => res.status(400).json('Incorrect email or password'))
              }else {
                res.status(400).json('Incorrect email or password')
              }
            }else {
              res.status(400).json('Wrong credentials')
            }
          })
      }else {
        res.status(400).json('User account does not exist');
      }
    })
    .catch(err => {
      res.status(400).json('unable to signin')
    });
}

module.exports = {
  handleSignIn: handleSignIn
}