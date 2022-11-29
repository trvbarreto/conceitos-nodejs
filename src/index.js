const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

// Middleware
function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find(user => user.username === username);

  if(!user) {
    return response.status(400).json({ error: 'User not found.'})
  }

  request.user = user;

  return next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;

  if (users.find(user => user.username === username)) {
    return response.status(400).json({error: "create a new user when username already exists"})
  }

  const user = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  };

  users.push(user);

  return response.status(201).send(user);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  return response.json(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;

  const todo = {
    id: uuidv4(),
    title: title,
    done: false, 
    deadline: new Date(deadline), 
    created_at: new Date(),
  };

  user.todos.push(todo);

  return response.status(201).send(todo);
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { title, deadline } = request.body;

  if (!(user.todos.find(todo => todo.id === request.params.id))) {
    return response.status(404).json({ error: 'Cannot update a non existing todo'});
  }
  
  user.todos.find(todo => todo.id === request.params.id).title = title;
  user.todos.find(todo => todo.id === request.params.id).deadline = new Date(deadline);

  return response.status(200).send(user.todos.find(todo => todo.id === request.params.id));
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { user } = request;

  if (!(user.todos.find(todo => todo.id === request.params.id))) {
    return response.status(404).json({ error: 'Cannot mark a non existing todo as done'});
  }
  
  user.todos.find(todo => todo.id === request.params.id).done = true;

  return response.status(200).send(user.todos.find(todo => todo.id === request.params.id));
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  
  const todoIndex = user.todos.findIndex(todo => {
    return todo.id === request.params.id;
  });

  if (todoIndex === -1) {
    return response.status(404).json({ error: 'Cannot delete a non existing todo'})
  }

  user.todos.splice(todoIndex, 1);  

  // 204 = resposta sem conteudo
  return response.status(204).send();
});

module.exports = app;