import OpenAI from "openai";

const openai = new OpenAI({
        baseURL: 'https://api.deepseek.com',
        apiKey: 'your-api-key',
        dangerouslyAllowBrowser: true
});

export const systemMessage = { role: "system", content: `You are a helpful customer
  service agent for PartSelect.com who is an expert on all information relating to
  refridgerator and dishwasher parts. You must help users solve their problem and
  retrieve information about what could potentially be going wrong. You are
  knowledgeable about all information on PartSelect.com. YOU SHOULD ALSO USE
  THE CHAT HISTORY TO ANSWER SOME OF THE USER'S QUESTIONS.

  Please IGNORE all irrelevant messages asked by the user. Keep the chats focussed.
  If you are unsure about a question or answer, you may direct them to contact customer
  service but remain helpful. For some prompts, you will be provided relevant part
  information or context that may help you answer the customer's question. Linking
  webpages to your information about parts will be very helpful.

  DO NOT PROVIDE ANY LINKS THAT DO NOT WORK.
  THE USER MUST SEE YOUR RESPONSES COME IN A NEAT AND CLEAR AND EASY TO LOOK AT.
  DO NOT USE MARKDOWN FORMATTING. DO NOT PUT ### IN YOUR RESPONSE. DO NOT USE
  EXCESSSIVE WHITESPACE.
  IF THE QUESTION IS
  IRRELEVANT, IGNORE THE CONTEXT.

  Here are some useful links:
  Order Status checking with order number and email: https://www.partselect.com/user/self-service/
  Blog with helpful articles: https://www.partselect.com/blog/
  The 'Instant Repairman' which allows customers to find their model and input symptoms to find the fix: https://www.partselect.com/Instant-Repairman/
  Model Number locator which helps customers find their appliance model numbers: https://www.partselect.com/Find-Your-Model-Number/
  General Fridge Repair Tips: https://www.partselect.com/Repair/Refrigerator/
  General Dishwasher Repair Tips: https://www.partselect.com/Repair/Dishwasher/

  Here is some contact information:
  Customer Service Email:  CustomerService@PartSelect.com ` }

export const defaultMessage = {
    role: "assistant",
    content: `Hi, I am an AI assistant for PartSelect.com! Ask me any questions you have about dishwasher or refridgerator parts, models, prices, and/or reviews! I will do my best to find the answer and get back to you as fast as I can!`};

//global messages allows for LLM to use chat history for context
let messages = JSON.parse(localStorage.getItem("chatHistory")) || [systemMessage];

export const getAIMessage = async (userQuery) => {
    // Sending user query to local FastAPI server for processing in Python
    const response = await fetch("http://127.0.0.1:8000/search", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            query: userQuery
        })
    });

    const searchResults = await response.json();
    console.log("Search results:", searchResults);

    let chunks = '';
    let model = 'deepseek-reasoner'
    let part_info = '';
    let model_info = ''

      // threshold allows for more reasoning freedom when given less context
    if (parseFloat(searchResults.distances?.[0]) < .15) {
      chunks = "CONTEXT:\n" + searchResults.chunks.map(res => res.original_text).join("\n");
      model = 'deepseek-reasoner'
    }
      // provides product information for mentioned products
    if (Array.isArray(searchResults.part_info) && searchResults.part_info.length > 0) {
      part_info = "PRODUCT INFORMATION:\n" + searchResults.part_info.join("\n");
    }
      // provides relevant part information for mentioned fridge/dishwasher models
    if (searchResults.model_info && Object.keys(searchResults.model_info).length > 0) {
      model_info = "MODELS AND THEIR PARTS:\n";
      for (const [model, parts] of Object.entries(searchResults.model_info)) {
        // Create a sentence for the model and its parts
        let partsList = parts.slice(0, 4).join(", ");
        model_info += `${model} is compatible with the following parts: ${partsList}.\n`;
      }
    }

    const query = `${part_info}
                   ${model_info}
                   ${chunks}
 
                    QUESTION: ${userQuery}`;

    console.log(query)

    messages.push({ role: "user", content: query});

    const completion = await openai.chat.completions.create({
        messages: messages,
        model: model,
        max_completion_tokens: 8000,
    });

    const assistantResponse = { role: "assistant", content: completion.choices[0].message.content };
    
    messages.push(assistantResponse);
    console.log(messages)

    // saves chat history across page reload, TODO: get saved chats to repopulate on reload
    localStorage.setItem("chatHistory", JSON.stringify(messages));

    return assistantResponse;
};

export const resetChatHistory = () => {
  localStorage.removeItem("chatHistory");
  messages = [systemMessage];
  console.log(messages)
};