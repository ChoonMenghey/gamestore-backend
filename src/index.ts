import express from 'express';

const app = express();
const PORT = 3000;

app.use(express.json());


app.use('/', (req, res) => {
    res.send('Hello, Game Store Backend!');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});