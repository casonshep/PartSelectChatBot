This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Install Requirements 

Make a venv or install the necessary packages in requirements.txt.

# Launching the Project


## 1) Start FastAPI Server for Python Script

Make sure you have `uvicorn` installed.

Navigate to the directory where server.py is.

Run `uvicorn server:app --reload`.

This will reload when you make any changes to the /api/ directory

## 2) Start App in Dev Mode

Assuming you have node.js installed, and you have already ran `npm install`, in the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

## 3) Replace `your-api-key` with DeepSeek API Key

In `src/api/api.js`, fill in your api key to use DeepSeek API.