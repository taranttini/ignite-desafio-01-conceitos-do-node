const express = require("express");
const cors = require("cors");

const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

const TODO_NOT_FOUND = "'todo' not found";

const findUser = (username) =>
  users.find(
    (user) =>
      String(user.username).toLowerCase() === String(username).toLowerCase()
  );

const findTodo = (user, todoId) =>
  user.todos.find((todo) => todo.id === todoId);

const sendErro = (response, status, error) =>
  response.status(status).json({ status, error });

const sendOK = (response, data) => response.status(200).json(data);
const sendCreated = (response, data) => response.status(201).json(data);
const send204 = (response) => response.status(204).send();
const send400 = (response, error) => sendErro(response, 400, error);
const send404 = (response, error) => sendErro(response, 404, error);

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  if (!username)
    return send400(response, "it's necessary 'username' on header");

  const user = findUser(username);

  if (!user) return send404(response, "'username' not found");

  request.user = user;

  next();
}

const isInvalidDate = (date) =>
  new Date(date).toString() === new Date(".").toString();

app.post("/users", (request, response) => {
  const { name, username } = request.body;

  if (!username) return send400(response, "it's necessary 'username' on body");

  const user = findUser(username);

  if (user) return send400(response, "already exists this 'username'");

  const newUser = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  };

  users.push(newUser);

  return sendCreated(response, newUser);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return sendOK(response, user.todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { title, deadline } = request.body;

  if (!title || !deadline)
    return send400(response, "it's necessary 'title' and 'deadline' on body");

  if (isInvalidDate(deadline))
    return send400(response, "'deadline' date is invalid");

  const newPost = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline).toISOString(),
    created_at: new Date().toISOString(),
  };

  user.todos.push(newPost);

  return sendCreated(response, newPost);
});

app.put("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { title, deadline } = request.body;
  const { id } = request.params;

  const todo = findTodo(user, id);

  if (!todo) return send404(response, TODO_NOT_FOUND);

  if (deadline && isInvalidDate(deadline))
    return send400(response, "'deadline' date is invalid");

  if (title) todo.title = title;

  if (deadline) todo.deadline = new Date(deadline).toISOString();

  return sendOK(response, todo);
});

app.patch("/todos/:id/done", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { id } = request.params;

  const todo = findTodo(user, id);

  if (!todo) return send404(response, TODO_NOT_FOUND);

  todo.done = true;

  return sendOK(response, todo);
});

app.delete("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { id } = request.params;

  const todo = findTodo(user, id);

  if (!todo) return send404(response, TODO_NOT_FOUND);

  user.todos = user.todos.filter((todo) => todo.id != id);

  return send204(response);
});

module.exports = app;
