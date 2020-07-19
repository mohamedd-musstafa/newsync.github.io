const dotenv = require('dotenv');

dotenv.config();

const port = process.env.PORT || 0;

module.exports = {
  port,
};
