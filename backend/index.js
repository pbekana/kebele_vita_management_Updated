require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
//const swaggerUi = require('swagger-ui-express');
//const YAML = require('yamljs');

connectDB();

const app = express();
app.use(cors());
app.use(express.json());

//const swaggerDocument = YAML.load('./docs/openapi.yaml');
//app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/Person', require('./routes/Person'));
app.use('/api/IdCard', require('./routes/IdCard'));
app.use('/api/BirthCertification', require('./routes/BirthCertification'));
app.use('/api/DeathRegistration', require('./routes/DeathRegistration'));
app.use('/api/DivorceRegistration', require('./routes/DivorceRegistration'));
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));