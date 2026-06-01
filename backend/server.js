import express from "express";
import cors from "cors";

// Importamos JSON
import usuarios from "./usuarios.json" with { type: "json"};

const app = express();

app.use(cors());
app.use(express.json());

// API
app.get("/usuarios", (req, res) => {
    res.json(usuarios);
})

app.listen(3001, () => {
    console.log("Servidor backend en puerto 3001 funcionando")
});