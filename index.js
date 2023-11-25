const express = require('express');
const bodyParser = require('body-parser');
const jsonServer = require('json-server');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = 5002;

app.use(bodyParser.json());
app.use(cors());


const generateJwtToken = (user) => {
 
  const secretKey = '56ClC+zy9~jp@AO_rBNF|cL1P}9A03';
  const token = jwt.sign({ userId: user.id }, secretKey, { expiresIn: '1h' });

  console.log(token);
  return token;
};

const generateUniqueId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const hashPassword = async (password) => {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
};

const checkPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};


const usersFilePath = path.join(__dirname, 'users.json');

app.post('/register', async (req, res) => {
  try {
    const { email, username } = req.body;

    const newUser = {
      id: generateUniqueId(), 
      username: username,
      email: email,
      password: await hashPassword(req.body.password),
    };

    writeUserToFile(newUser); 

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }

});



app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = getUserByEmail(email);

  if (user && await checkPassword(password, user.password)) {
    const token = generateJwtToken(user);
    res.json({ accessToken: token });
  } else {
    res.status(401).json({ error: 'Invalid email or password' });
  }
  
});


const usersRouter = jsonServer.router('users.json');
app.use('/api', usersRouter);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});


const getUserByEmail = (email) => {
  try {
    const data = fs.readFileSync(usersFilePath, 'utf-8');
    const jsonData = JSON.parse(data);
    const users = jsonData.users;

    return users.find((user) => user.email === email);
  } catch (error) {
    console.error('Error reading users file:', error.message);
    return null;
  }
};

const writeUserToFile = (newUser) => {
  try {
    const users = readUsersFromFile();
    users.push(newUser);
    fs.writeFileSync(usersFilePath, JSON.stringify({ users }, null, 2), 'utf-8');
  } catch (error) {
    console.error(error);
  }
};

const readUsersFromFile = () => {
  try {
    const usersContent = fs.readFileSync(usersFilePath, 'utf-8');
    return JSON.parse(usersContent).users;
  } catch (error) {
    console.error(error);
    return [];
  }


};