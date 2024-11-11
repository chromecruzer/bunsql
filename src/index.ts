import { Hono } from 'hono';
import { Database } from 'bun:sqlite';
import pug from 'pug';

const db = new Database('mydb.sqlite');
const app = new Hono();

// Compile the Pug template
const renderTemplate = (templatePath: string, data: object = {}) => pug.compileFile(templatePath)(data);

// Ensure table exists
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT
  );
`);

// Fetch all users from the database
const fetchUsers = (): { id: number; name: string; email: string }[] => db.query('SELECT * FROM users').all();

// Serve the main page with the form and user list
app.get('/', (c) => {
  const users = fetchUsers();
  const html = renderTemplate(process.cwd() + '/src/views/index.pug', { users });
  return c.html(html);
});

// Route to handle adding a user 
app.post('/users', async (c) => {
  const { name, email } = await c.req.parseBody<{ name: string; email: string }>();
  db.run('INSERT INTO users (name, email) VALUES (?, ?)', [name, email]);
  const users = fetchUsers();
  // Only return the updated user list (form is static)
  const userListHtml = renderTemplate(process.cwd() + '/src/views/user_list.pug', { users });
  return c.html(userListHtml); // Only the updated list
});

// Route to delete a user
app.delete('/users/:id', (c) => {
  const id = c.req.param('id');
  db.run('DELETE FROM users WHERE id = ?', [id]);
  const users = fetchUsers();
  // Only return the updated user list (form is static)
  const userListHtml = renderTemplate(process.cwd() + '/src/views/user_list.pug', { users });
  return c.html(userListHtml); // Only the updated list
});

// Route to display the edit form for a specific user
app.get('/users/:id/edit', (c) => {
  const id = c.req.param('id');
  const user = db.query('SELECT * FROM users WHERE id = ?', [id]).get();

  if (!user) {
    return c.html('User not found');  // You can return a custom error message or a 404 page here.
  }

  const editFormHtml = renderTemplate(process.cwd() + '/src/views/edit_form.pug', { user });
  return c.html(editFormHtml);
});
// const userId = 1;  // for example, replace with a valid user ID
// const user = db.query('SELECT * FROM users WHERE id = ?', [userId]).get();
// console.log(user);


// Route to update a user
app.put('/users/:id', async (c) => {
  const id = c.req.param('id');
  const { name, email } = await c.req.parseBody<{ name: string; email: string }>();
  db.run('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, id]);
  const users = fetchUsers();
  // Only return the updated user list (form is static)
  const userListHtml = renderTemplate(process.cwd() + '/src/views/user_list.pug', { users });
  return c.html(userListHtml); // Only the updated list
});

export default app; 
