const path = require('path');
const Dotenv = require('dotenv-webpack');

module.exports = {
  entry: './public/js/scripts.js',  
  output: {
    filename: 'bundle.js',  
    path: path.resolve(__dirname, 'dist')  
  },
  plugins: [
    new Dotenv() 
  ],
  module: {
    rules: [
      {
        test: /\.js$/,  
        exclude: /node_modules/,  
        use: {
          loader: 'babel-loader'  
        }
      }
    ]
  }
};
