require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const axios = require('axios');


const app = express();
const port = process.env.port || 3000;

// Acceder a las variables de entorno
const apiKey = process.env.apiKey;
const mongoURI = process.env.MONGO_URI;

// Middleware
app.use(express.json());
app.use(cors());

// Conectar a MongoDB
mongoose.connect(mongoURI)
    .then(() => console.log('✅ Conectado a MongoDB'))
    .catch((error) => console.error('❌ Error de conexión a MongoDB:', error));

// Definir esquema y modelo (utilizamos este modelo para almacenar el clima y las ciudades)
const weatherSchema = new mongoose.Schema({
    city_name: String,
    temperature: Number,
    humidity: Number,
    wind_speed: Number,
    description: String,
    updated_at: { type: Date, default: Date.now },
});

const Weather = mongoose.model('Climas', weatherSchema);

// Función para obtener y guardar datos del clima desde la API (solo se ejecuta al iniciar)
const fetchWeatherData = async (cities) => {
    for (const city of cities) {
        try {
            const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
                params: {
                    q: city,
                    appid: apiKey,
                    units: 'metric',
                },
            });

            const data = response.data;
            const weatherInfo = {
                city_name: city,
                temperature: data.main.temp,
                humidity: data.main.humidity,
                wind_speed: data.wind.speed,
                description: data.weather[0]?.description || 'No disponible',
            };

            await Weather.findOneAndUpdate({ city_name: city }, weatherInfo, { upsert: true });
            console.log(`✅ Datos guardados para: ${city}`);
        } catch (error) {
            console.error(`❌ Error obteniendo datos de ${city}:`, error.response?.data || error.message);
        }
    }
};

// Ciudades a cargar al iniciar (incluye algunas ciudades de ejemplo)
const initialCities = [
    'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
    'Bucaramanga', 'Pereira', 'Santa Marta', 'Manizales', 'Armenia',
    'Cúcuta', 'Ibagué', 'Popayán', 'Pasto', 'Montería',
    'Sincelejo', 'Neiva', 'New York', 'Tunja', 'Riohacha'
];

// Cargar datos al iniciar el servidor
fetchWeatherData(initialCities);

// Servir archivos estáticos (CSS, JS, imágenes) desde la carpeta "Estilos"
app.use(express.static(path.join(__dirname, 'Estilos')));

// Rutas básicas para la aplicación de clima
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/weather/:city', async (req, res) => {
    try {
        const city = req.params.city;
        const weather = await Weather.findOne({ city_name: city });
        if (weather) {
            res.json(weather);
        } else {
            res.status(404).json({ message: '❌ Datos no encontrados' });
        }
    } catch (error) {
        res.status(500).json({ message: '❌ Error al buscar en la base de datos' });
    }
});

// Endpoints para la gestión de ciudades (panel de administración)

// [CAMBIO PRINCIPAL] Obtener todas las ciudades con todos los campos
app.get('/cities', async (req, res) => {
    try {
        // Se quita la selección 'city_name' para que devuelva todos los campos
        const cities = await Weather.find({});
        res.json(cities);
    } catch (error) {
        res.status(500).json({ message: 'Error obteniendo ciudades' });
    }
});

// Agregar una nueva ciudad con todos los campos
app.post('/cities', async (req, res) => {
    try {
        const { city_name, description, temperature, humidity, wind_speed } = req.body;

        if (!city_name) {
            return res.status(400).json({ message: 'El nombre de la ciudad es requerido' });
        }

        const newCity = new Weather({
            city_name,
            description,
            temperature,
            humidity,
            wind_speed
        });

        await newCity.save();
        res.status(201).json(newCity);
    } catch (error) {
        res.status(500).json({ message: 'Error agregando la ciudad' });
    }
});

// Actualizar una ciudad (por _id)
app.put('/cities/:id', async (req, res) => {
    try {
        const { city_name, description, temperature, humidity, wind_speed } = req.body;

        const updatedCity = await Weather.findByIdAndUpdate(
            req.params.id,
            { city_name, description, temperature, humidity, wind_speed },
            { new: true } // para devolver el documento actualizado
        );

        res.json(updatedCity);
    } catch (error) {
        res.status(500).json({ message: 'Error actualizando la ciudad' });
    }
});

// Eliminar una ciudad (por _id)
app.delete('/cities/:id', async (req, res) => {
    try {
        await Weather.findByIdAndDelete(req.params.id);
        res.json({ message: 'Ciudad eliminada' });
    } catch (error) {
        res.status(500).json({ message: 'Error eliminando la ciudad' });
    }
});

// Endpoint para servir la interfaz de administración
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`🚀 Servidor corriendo en: http://localhost:${port}`);
});
