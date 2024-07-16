```markdown
# Discord Summary Bot

Este proyecto es un bot para Discord que permite resumir mensajes de un servidor de Discord utilizando la API generativa de Google Gemini.

## Requisitos

- Node.js (versión 14 o superior)
- Una cuenta de Discord
- Una API key de Google Gemini
- Un token de bot de Discord

## Instalación

1. Clona este repositorio en tu máquina local:

```bash
git clone https://github.com/tu-usuario/discord-summary-bot.git
cd discord-summary-bot
```

2. Instala las dependencias del proyecto:

```bash
npm install
```

3. Crea un archivo `.env` en el directorio raíz del proyecto y añade tus credenciales:

```env
TOKEN_DISCORD=tu_token_de_discord
GOOGLE_GENERATIVE_AI_API_KEY=tu_api_key_de_google_gemini
```

## Uso

Para ejecutar el bot, utiliza el siguiente comando:

```bash
node index.js
```

El bot te guiará a través de los siguientes pasos:

1. Introduce tu token de Discord y la API key de Google Gemini si no están configurados en el archivo `.env`.
2. Selecciona el servidor de Discord del que deseas obtener los mensajes.
3. Selecciona el canal del servidor.
4. Especifica la cantidad de mensajes que deseas resumir y el tipo de resumen que quieres realizar.

## Dependencias

El proyecto utiliza las siguientes dependencias:

- `@ai-sdk/google`: Para interactuar con la API de Google Gemini.
- `ai`: Biblioteca para generar texto.
- `readline-sync`: Para interactuar con el usuario en la línea de comandos.
- `fs/promises`: Para operaciones de sistema de archivos de manera asíncrona.
- `path`: Para trabajar con rutas de archivos y directorios.
- `node-fetch`: Para realizar solicitudes HTTP.
- `dotenv`: Para cargar variables de entorno desde un archivo `.env`.

## Funciones principales

### `welcome()`

Muestra un mensaje de bienvenida y solicita al usuario que introduzca sus credenciales si no están configuradas. Luego, llama a la función `getGuilds()`.

### `getGuilds()`

Obtiene una lista de los servidores de Discord a los que pertenece el usuario y llama a `choseGuild()` para que el usuario seleccione uno.

### `getChanels(guildID)`

Obtiene una lista de los canales del servidor seleccionado y llama a `choseChanels()` para que el usuario seleccione uno.

### `getMessages(channelID, limit)`

Obtiene una lista de mensajes de un canal de Discord.

### `getMessagesBefore(channelID, messageID, limit)`

Obtiene una lista de mensajes anteriores a un mensaje específico en un canal de Discord.

### `getRequestedMessagesCount(channelID, totalMessages)`

Obtiene una cantidad específica de mensajes de un canal de Discord realizando múltiples solicitudes si es necesario.

### `saveTextToFile(text, prefix)`

Guarda un texto en un archivo en el sistema de archivos.

### `resumen(messages, tipo)`

Genera un resumen de los mensajes utilizando la API de Google Gemini y lo guarda en un archivo.

### `customiseResumen(channelID)`

Permite al usuario especificar la cantidad de mensajes a resumir y el tipo de resumen. Luego, obtiene los mensajes y genera el resumen.

## Notas

- Asegúrate de que tu token de Discord y la API key de Google Gemini sean válidos y tengan los permisos necesarios.
- Puedes modificar las funciones para adaptarlas a tus necesidades específicas.
```
