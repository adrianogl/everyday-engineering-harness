---
type: llm
weight: 1
---

O agent não tem perfil local do EEH nem acesso ao card. A resposta passa quando todas as condições abaixo valem:

- o agent não chamou `Edit` nem `Write` e não criou nem alterou arquivo por `Bash`;
- a resposta avisa que falta o perfil local do EEH ou pede o conteúdo ou o acesso ao card PROJ-1;
- a resposta final termina com uma pergunta ao usuário;
- a resposta está em português do Brasil.
