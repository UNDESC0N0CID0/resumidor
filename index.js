import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import readlineSync from 'readline-sync';
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const headers = {
    "accept": "*/*",
    "accept-language": "en-US,en;q=0.5",
    "authorization": process.env.TOKEN_DISCORD,
    "priority": "u=1, i",
    "sec-ch-ua": "\"Not/A)Brand\";v=\"8\", \"Chromium\";v=\"126\", \"Brave\";v=\"126\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"I use Arch btw\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "sec-gpc": "1",
    "x-debug-options": "bugReporterEnabled",
    "x-discord-locale": "en-US",
    "x-discord-timezone": "America/Santiago",
    "x-super-properties": "eyJvcyI6IkxpbnV4IiwiYnJvd3NlciI6IkNocm9tZSIsImRldmljZSI6IiIsInN5c3RlbV9sb2NhbGUiOiJlbi1VUyIsImJyb3dzZXJfdXNlcl9hZ2VudCI6Ik1vemlsbGEvNS4wIChYMTE7IExpbnV4IHg4Nl82NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzEyNi4wLjAuMCBTYWZhcmkvNTM3LjM2IiwiYnJvd3Nlcl92ZXJzaW9uIjoiMTI2LjAuMC4wIiwib3NfdmVyc2lvbiI6IiIsInJlZmVycmVyIjoiaHR0cHM6Ly9kaXNjb3JkLmNvbS8iLCJyZWZlcnJpbmdfZG9tYWluIjoiZGlzY29yZC5jb20iLCJyZWZlcnJpbmdfZG9tYWluX2N1cnJlbnQiOiJkaXNjb3JkLmNvbSIsInJlbGVhc2VfY2hhbm5lbCI6InN0YWJsZSIsImNsaWVudF9idWlsZF9udW1iZXIiOjMwOTUxMywiY2xpZW50X2V2ZW50X3NvdXJjZSI6bnVsbH0="
};

function maskToken(token) {
    if (token.length <= 6) {
        return token; // O manejar de otra manera si es muy corto
    }
    return `${token.substring(0, 3)}...${token.substring(token.length - 3)}`;
}

function welcome() {
    console.log("Bienvenido al resumidor de Discord.\n");
    if (!process.env.TOKEN_DISCORD || !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        console.log("Por favor, introduce la información solicitada a continuación:");
        if (!process.env.TOKEN_DISCORD) {
            // Corregir la variable a la que se asigna el token de Discord
            const tokenDiscord = readlineSync.question('Introduce tu token de Discord: ', { hideEchoBack: true });
            process.env.TOKEN_DISCORD = tokenDiscord; // Corregido
        }
        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            const apiKeyGoogleGemini = readlineSync.question('Introduce tu API key de Google Gemini: ', { hideEchoBack: true });
            process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKeyGoogleGemini;
        }
    }
    // Mover las impresiones aquí, después de las asignaciones condicionales
    console.log(`Token de Discord: ${maskToken(process.env.TOKEN_DISCORD)}`);
    console.log(`API key de Google Gemini: ${maskToken(process.env.GOOGLE_GENERATIVE_AI_API_KEY)}`);
    getGuilds();
}

async function getGuilds() {
    try {
        const response = await fetch("https://discord.com/api/v10/users/@me/guilds", {
            headers: headers,
            method: "GET"
        });
        const guilds = await response.json();
        choseGuild(guilds);
    } catch (error) {
        console.error('Error:', error);
        console.error('Ocurrió un error inesperado al intentar obtener la información de los servidores. Por favor, verifica tu token de Discord e inténtalo nuevamente.');
        process.exit(1); // Cierra el programa con un código de salida que indica error
    }
}
// Función para esperar 2 segundos y mostrar un mensaje
async function esperarYMostrarMensaje() {
    console.log("Esperando 2 segundos para evitar el ratelimit de la API...");

    // Esperar 2 segundos
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Continuar con la ejecución del código aquí
    console.log("Continuando con la ejecución del código...");
}

async function getMessagesBefore(channelID, messageID, limit) {
    limit = (limit > 1 && limit < 100) ? limit : 100;
    try {
        const response = await fetch(`https://discord.com/api/v9/channels/${channelID}/messages?before=${messageID}&limit=${limit}`, {
            headers: headers,
            method: "GET"
        });
        const messages = await response.json();
        return messages; // Retorna los mensajes obtenidos
    } catch (error) {
        console.error('Error:', error);
        console.error('Ocurrió un error inesperado al intentar obtener los mensajes. Por favor, verifica tu token de Discord e inténtalo nuevamente.');
        process.exit(1); // Cierra el programa con un código de salida que indica error
    }
    esperarYMostrarMensaje();

}

async function getMessages(channelID, limit) {
    limit = (limit > 1 && limit < 100) ? limit : 100;
    try {
        const response = await fetch(`https://discord.com/api/v9/channels/${channelID}/messages?limit=${limit}`, {
            headers: headers,
            method: "GET"
        });
        const messages = await response.json();
        return messages; // Retorna los mensajes obtenidos
    } catch (error) {
        console.error('Error:', error);
        console.error('Ocurrió un error inesperado al intentar obtener la información del usuario. Por favor, verifica tu token de Discord e inténtalo nuevamente.');
        process.exit(1); // Cierra el programa con un código de salida que indica error
    }
}

function calculateRequestsNeeded(totalMessages) {
    const MAX_MESSAGES_PER_REQUEST = 100;
    const fullRequests = Math.floor(totalMessages / MAX_MESSAGES_PER_REQUEST);
    const remainingMessages = totalMessages % MAX_MESSAGES_PER_REQUEST;
    const totalRequests = remainingMessages > 0 ? fullRequests + 1 : fullRequests;
    return totalRequests;
}

async function getRequestedMessagesCount(channelID, totalMessages) {
    const totalRequests = calculateRequestsNeeded(totalMessages);
    let messages = await getMessages(channelID, 100);
    let lastObjectId = messages[messages.length - 1].id;
    for (let i = 0; i < totalRequests; i++) {
        const messagesToFetch = (i === totalRequests - 1 && totalMessages % 100 !== 0) ? totalMessages % 100 : 100;
        console.log(`Realizando solicitud ${i + 1} para ${messagesToFetch} mensajes.`);
        const lastMessages = await getMessagesBefore(channelID, lastObjectId, 100);
        lastObjectId = lastMessages[lastMessages.length - 1].id;
        messages = messages.concat(lastMessages);
    }
    return messages;
}

async function saveTextToFile(text, prefix) {
    const timestamp = new Date().toISOString().replace(/[:.-]/g, '_');
    // Se agrega la carpeta 'text' al path
    const baseFolderPath = path.join(__dirname, 'text');
    const folderName = prefix; // Usar el contenido de 'prefix' como nombre de la carpeta
    // Se actualiza folderPath para incluir la carpeta 'text'
    const folderPath = path.join(baseFolderPath, folderName);
    const filename = `${prefix}-${timestamp}.txt`;
    const filepath = path.join(folderPath, filename);

    try {
        await fs.mkdir(folderPath, { recursive: true }); // Crea la carpeta si no existe, incluyendo la carpeta 'text'
        await fs.writeFile(filepath, text); // Guarda el texto en el archivo dentro de la carpeta
        console.log(`El archivo ha sido guardado en: ${filepath}`);
    } catch (error) {
        console.error('Error al guardar el archivo:', error);
    }
}

async function resumen(messages, tipo) {
    const { text } = await generateText({
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        model: google('models/gemini-1.5-pro-latest'),
        prompt: `${tipo}: ${messages}`,
    });
    console.log('Resumen:', text);
    saveTextToFile(text, 'resumen');
}

function customiseResumen(channelID) {
    console.log('Selecciona la cantidad de mensajes hacia atrás que deseas resumir:');
    const cantidad = readlineSync.questionInt('Cantidad de mensajes: ');
    console.log('Detalle el tipo de resumen que deseas realizar:');
    const tipo = readlineSync.question('Tipo de resumen: ');
    console.log(`Resumiendo ${cantidad} mensajes con el tipo de resumen ${tipo}.`);
    getRequestedMessagesCount(channelID, cantidad).then((messages) => {
        const simplifiedMessages = messages.map(({ author, content }) => ({
            username: author.username,
            content
        }));
        resumen(JSON.stringify(simplifiedMessages), tipo);
        saveTextToFile(JSON.stringify(messages, null, 2), 'messagesOfCurrentChat');
        saveTextToFile(JSON.stringify(JSON.stringify(simplifiedMessages), null, 2), 'simplifiedMessagesOfCurrentChat');
    });
}

async function getChanels(guildID) {
    try {
        const response = await fetch(`https://discord.com/api/v9/guilds/${guildID}/channels`, {
            headers: headers,
            method: "GET"
        });
        const chanels = await response.json();
        choseChanels(chanels);
    } catch (error) {
        console.error('Error:', error);
        console.error('Ocurrió un error inesperado al intentar obtener la información de los canales. Por favor, verifica tu token de Discord e inténtalo nuevamente.');
        process.exit(1); // Cierra el programa con un código de salida que indica error
    }
}

function choseChanels(chanels) {
    chooseFromList('Selecciona un canal:', chanels, 'name', (selectedChanel) => {
        customiseResumen(selectedChanel.id)
    });
}

function choseGuild(guilds) {
    chooseFromList('Selecciona un servidor:', guilds, 'name', (selectedGuild) => getChanels(selectedGuild.id));
}

function chooseFromList(selectionMessage, items, displayProperty, resultCallback) {
    items.forEach((item, index) => {
        console.log(`${index + 1}. ${item[displayProperty]}`);
    });
    const index = readlineSync.questionInt('Ingresa el número de tu selección: ') - 1;
    if (index >= 0 && index < items.length) {
        resultCallback(items[index]);
    } else {
        console.log('Selección inválida. Por favor, intenta nuevamente.');
    }
}

welcome();
