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

# Design Choices
As someone who had not used JavaScript extensively to create web apps, I chose to focus on making the bot's responses as accurate and helpful as possible during the time I had allotted to complete this assignment. This meant prioritizing backend capabilities such as high-quality retrieval and robust model integration while keeping the front end clean and minimal to support clear user interaction.

## 1) Prompt Engineering for System Instructions
As with many RAG-based systems, getting high-quality responses relied on carefully crafting the system prompt. I customized the system message to reflect the domain-specific task: helping users find/repair/discuss refrigerator and dishwasher parts. I instructed the DeepSeek model to ignore messages from the user that were off-topic and keep the chat focused. I instructed the model to attempt to use the chat history to answer certain questions, and I instructed the model to format its outputs cleanly and clearly. This helped keep the UI uniform and pleasant to look at. I also decided to include some helpful links to the system message that would help the model when specific or particularly tricky questions were being asked. These included but were not limited to a customer service email, a repairman diagnostic tool, and a link where customers could check the status of their orders. Providing these links helped to solve many of the confounding questions that a user may ask, as the model was then able to point them to another of PartSelect.com's helpful tools.

## 4) RAG Pipeline 
The core of the assistant is a local RAG pipeline. When a user submits a query, the backend uses the `bge-small-en` model to embed the query and retrieve the top-k relevant documents from the vector store. These retrieved documents, along with some part or model-specific context, the system prompt, and chat history, are fed into the `deepseek-reasoner` (DeepSeek-R1 with CoT) model to generate the final response. This keeps the model grounded in real product data, improving factuality and relevance. All data used for these processes are in `src/API/data`.

### Database Construction and Chunk Indexing with Faiss
To build the knowledge base, I scraped key pages from the PartSelect site, focusing on refrigerator and dishwasher part listings, repair guides, and model-specific troubleshooting pages. PartSelect made this step particularly difficult, as they had built-in safeguards against automated scrapers and web tools like `selenium` and `beautifulsoup`. After a lot of troubleshooting and testing with these tools, I got temporarily IP banned from the PartSelect service!! Nevertheless, I was able to find a Chrome extension that allowed me to scrape the home page and all successive links for dishwashers and refrigerators, providing enough context for a proof-of-concept chat box like this. I preprocessed the text to remove things like formatting noise and excessive repetition, then chunked the content using a maximum number of sentences for the chunks. This was 3 in the final database as it allowed for up to 15 (top k=5 using `faiss`) sentences of context for RAG, which was a good amount considering our token limit of 64k. Each passage was embedded using `BAAI/bge-small-en` and stored in a locally indexed faiss vector database for fast retrieval.

### Part-Specific Context via Product Code Lookup
I also created a separate database of all the parts I could scrape from PartSelect.com. This was used when a query by the user contained a PartSelect part code. Taking the code, information like price, description, manufacturer code, etc, could then be quickly retrieved and added to the prompt as more part-specific context. 

### Model-Specific Context via Adjacency Graph Lookup
Finally, I created an undirected graph connecting model codes to part codes. Thus, when it was detected that a model code was inputted with the user's query, all relevant parts and subsequent information could be extracted and also added to the prompt as model-specific context. While not fully perfected yet, this graph is intended to be used in future iterations to constrain retrieval and improve recommendation precision by filtering results based on the specific model mentioned in the user's question.

## 3) Chat History Awareness
To ensure the model could maintain context across multiple turns, I implemented a chat history window log that preserved recent messages and included them in the input prompt. This allowed the model to follow up on ambiguous questions and carry on a multi-turn conversation effectively. I kept the window length minimal through the specifications of the RAG pipeline to reduce token bloat but ensured enough history for continuity.

## 4) UI Changes
The front end was kept minimal to emphasize clarity and responsiveness. I used the provided template and colorized it to match PartSelect's themes. I added status indicators (e.g., “Retrieving info…”), and a reset chat button that would reset the chat and the context history. The page also stores context history upon reloading the page. While not perfect, as the historical messages do not repopulate on page reload, this does allow a user to pick up where they left off if they experience any interruptions.


## 5) Honorable Mentions
Web scraping and database construction have the potential to dramatically improve results. I was working with a very rudimentary scraper that left a lot of text scrambled and repetitive.

Local inference was heavily looked into so as to speed up the response latency, with models like `DeepSeek-R1-Distill-Llama-8B` being considered. Ultimately, I ran out of time before I was able to solve this.

I avoided overengineering—just enough tooling and infrastructure to make the assistant useful without adding complexity I couldn’t maintain long-term.