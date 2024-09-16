@ECHO OFF
CALL IF NOT EXIST .\node_modules\ ( 
    CALL npm install 
)

CALL node index.js