# A LENDA ÁUREA: Jorge e o Dragão
### Game Design Document — v0.2 (expansão de mundo e história)

> *"Não temas, pois eu estou contigo."* — Isaías 41:10

> **Por que a v0.2 existe.** Playtest da v0.1 revelou quatro problemas: a história inteira cabia num resumo de meia página; as bênçãos dos santos chegavam rápido demais, sem custo dramático; a lança **Ascalon** era citada no texto (e até no controle de "ataque pesado") mas nunca existia como item — Jorge simplesmente já "tinha" uma lança lendária desde o primeiro segundo; e havia dinário no bolso do jogador sem nenhum lugar para gastá-lo. Este documento resolve os quatro pontos ampliando o mundo, esticando a jornada e dando peso material à progressão. A estrutura de 3 atos e os sistemas de combate/loot da v0.1 continuam válidos — o que muda é *quanto mundo existe entre o início e o fim*.

---

## 1. Visão Geral

| | |
|---|---|
| **Título** | A Lenda Áurea: Jorge e o Dragão |
| **Gênero** | Action-RPG 2D top-down (Lufia × Diablo × God of War) |
| **Plataforma** | Navegador (HTML5 / Canvas / JavaScript puro, sem dependências) |
| **Perspectiva** | Top-down 2D, pixel art 16×16 |
| **Tom** | Fantasia épica inspirada na hagiografia católica — respeitosa, mas ficcional |
| **Protagonista** | Jorge da Capadócia (São Jorge), soldado romano e cavaleiro de Cristo |

### O que vem de cada inspiração

- **Lufia**: agora levada a sério — um mapa-múndi grande, com várias cidades e regiões distintas a percorrer, cada uma escondendo um item ou aliado necessário para a missão principal, e vilarejos aos quais se volta mais tarde e que reagem ao que o jogador já fez.
- **Diablo (1997)**: loot com raridades, dungeons que descem em direção ao mal, atmosfera de escuridão crescente, hordas de demônios.
- **God of War**: combate visceral em tempo real, combos, esquiva, medidor de **Fúria Sagrada**, chefes monumentais, uma arma que evolui fisicamente com a jornada do herói (como o Machado de Leviatã) em vez de aparecer pronta.

---

## 2. História

### 2.1 Premissa

Século III d.C. O imperador **Diocleciano** intensifica a perseguição aos cristãos por meio de **editos** cada vez mais duros — o primeiro apenas retira direitos civis e ordena queimar as Escrituras; os seguintes prendem clérigos, exigem sacrifício aos deuses do Estado e, por fim, cominam pena de morte a quem recusar. Esses editos chegam ao jogador como notícia, lidos por um pregoeiro em cada cidade visitada — um relógio narrativo que vai apertando ao longo de toda a jornada, não só no final.

Sob a cidade líbia de **Silena**, as **Portas do Abismo** se romperam, e um **Dragão** — não uma besta, mas um príncipe das legiões caídas — exige tributos humanos em troca de poupar a cidade.

**Jorge**, tribuno romano da Capadócia e cristão secreto, recebe em sonho a visita de **São Miguel Arcanjo**, que lhe entrega a missão: descer até as raízes do mal, fechar as Portas e enfrentar o Dragão. Mas Jorge não parte com Ascalon em punho — parte com a **lança de guarnição** que qualquer tribuno carrega, comum e sem nome. Ascalon **não existe ainda**. Ela será forjada peça por peça, ao longo de uma peregrinação por terras ligadas a sete santos mártires, cada um guardião de uma bênção e de um fragmento da lança que um dia enfrentará o próprio Dragão.

### 2.2 O Mundo — a Peregrinação

A v0.1 tinha, na prática, dois mapas: Capadócia e Silena, com as Sete Fossas empilhadas debaixo de Silena como um poço vertical. A v0.2 abre esse poço para os lados: cada uma das sete bênçãos passa a ter uma **região de superfície** própria — vila, gente, um problema local a resolver — e só depois disso a **fossa correspondente**, que continua existindo tal como já implementada, agora acessada a partir do santuário daquela região em vez de encadeada diretamente à fossa anterior.

| Região (superfície) | Santo | Pecado / Fossa (já existe no código) | Ideia central |
|---|---|---|---|
| **Capadócia** | — | Prólogo | Lar de Jorge; onde tudo começa, com a lança comum. |
| **Silena** | — | Ato I (hub) | Cidade do tributo; Sabra, o pântano, as Catacumbas. |
| **Catacumbas dos Mártires** | Santa Bárbara | Ira → Sebastião¹ | Já implementado; fecha o Ato I. |
| **Forte Sebaste** | São Sebastião | Fossa da Ira | Guarnição imperial nas fronteiras de Silena — companheiros de farda de Jorge, alguns já sob suspeita dos editos. |
| **Porto de Luzia** | Santa Luzia | Fossa da Inveja | Cidade-farol litorânea; comércio de vidro e peixe, olhos gananciosos, um farol que guia navios e também demônios. |
| **Ermo de Antão** | Santo Antão | Fossa da Gula | Deserto de eremitas; miragens de banquetes são a própria tentação que abre a Fossa. |
| **Cidade Imperial — distrito do Tesouro** | São Lourenço | Fossa da Avareza | Segunda visita à mesma Cidade Imperial de Forte Sebaste, agora em seu bairro de cofres e esmolas — Lufia-style: volta-se a um lugar já visitado, mudado pela história. |
| **Jardim de Inês** | Santa Inês | Fossa da Luxúria | Já implementado como "jardim das delícias"; ganha vila anexa. |
| **Mosteiro de Núrsia** | São Bento | Fossa da Preguiça | Mosteiro nas montanhas, adormecido em torpor demoníaco; fecha o Ato II. |
| **Nicomédia** (só ecoa, não se visita até o fim) | — | Ato III / Epílogo | Corte de Diocleciano; onde o martírio de Jorge o espera — mencionado por cartas e fugitivos ao longo de toda a peregrinação, visitado apenas na reta final. |
| **As Portas do Abismo** | — | Ato III | Sob Silena; só se abrem com as sete bênçãos reunidas. |

¹ *Nota de continuidade*: a v0.1 tinha uma inconsistência entre o GDD (Ira→Bárbara) e o código (Catacumbas→Bárbara, Fossa da Ira→Sebastião). A v0.2 assume o código como fonte da verdade e corrige o texto.

**Como isso se conecta no mapa**: ao sair de Silena, Jorge encontra uma encruzilhada de **Estradas do Império** — um mapa de viagem simples (nós ligados por caminhos, com encontros aleatórios leves) que desbloqueia um novo destino por vez, à medida que a história avança. Não é preciso desenhar um continente fotorrealista: basta que cada região seja um mapa próprio, ligado por uma tela de estrada/porto, para que a sensação de "isto é um mundo grande" apareça — exatamente como Lufia liga suas cidades por um overworld.

### 2.3 A Lança — de guarnição a Ascalon

| Estágio | Onde | O que muda |
|---|---|---|
| **Lança de guarnição** | Prólogo, Capadócia | Arma inicial, comum, sem nome. Dano-base do "ataque pesado". |
| **Reforços de ferreiro** | Qualquer forja (Silena e cada hub novo) | Com denários, o ferreiro **Rufo** reforça cabo e ponta — upgrades numéricos incrementais, compráveis, não narrativos. |
| **7 Fragmentos de Ascalon** | Um por bênção concedida (Bárbara, Sebastião, Luzia, Antão, Lourenço, Inês, Bento) | Não se compram. Cada espírito de santo entrega, além do milagre, uma relíquia física — um prego, uma farpa de grelha, um elo de corrente, uma pena de ferro. |
| **Ascalon forjada** | Mosteiro de Núrsia, fecho do Ato II | Com os 7 fragmentos reunidos, São Bento (ou seu espírito) conduz a forja ritual: a lança comum é consumida e renasce como Ascalon. Momento de cutscene, não apenas um upgrade de menu — o "Machado de Leviatã" do jogo. |
| **Ascalon consagrada** | Portas do Abismo, Ato III | Temperada uma última vez no fogo do próprio Abismo antes do confronto final com a Serpente Antiga — upgrade final, cosmético e mecânico (novo efeito visual, dano ampliado). |

Isso resolve o problema de origem: por 2/3 do jogo, Jorge luta com uma arma **mortal, não mágica** — o que também justifica narrativamente por que ele precisa das bênçãos dos santos para sobreviver ao que vem pela frente.

### 2.4 Estrutura em Atos

**PRÓLOGO — Capadócia**
- Jorge, a lança de guarnição, a visita de São Miguel em sonho. Tutorial de movimento e combate básico.

**ATO I — A Cidade do Dragão (Silena)** *(como na v0.1, já implementado)*
- Silena sob o terror do tributo; a princesa **Sabra** é a próxima vítima sorteada.
- Vila, Pântano Envenenado (Gólgor, o Ladrão da Chave), Catacumbas dos Mártires.
- Primeira bênção: **Santa Bárbara** — Raio do Trovão + 1º fragmento de Ascalon.
- Primeiro confronto com o Dragão: ferido, mas revela-se guardião das Portas, não o mal final.
- **Boss do Ato**: o Dragão de Silena (1ª forma).

**ATO II — A Peregrinação das Sete Bênçãos**

Cada um dos seis capítulos restantes segue a mesma receita em duas metades — superfície primeiro, fossa depois — mas cada superfície tem seu próprio problema, personagens e comércio, para que "chegar à bênção" custe uma sessão inteira de jogo, não cinco minutos:

1. **Forte Sebaste** (São Sebastião / Ira) — companheiros de farda de Jorge, alguns já denunciados pelo primeiro edito; uma missão para libertar um soldado preso antes que a guarnição o entregue. Fossa da Ira: Amon. Bênção: Chuva de Setas.
2. **Porto de Luzia** (Santa Luzia / Inveja) — cidade-farol; um mercador ganancioso cobiça o próprio farol da santa. Fossa da Inveja: Leviatã. Bênção: Luz que Cega.
3. **Ermo de Antão** (Santo Antão / Gula) — eremitas famintos guiam Jorge através de miragens; resistir a um banquete ilusório antes de descer. Fossa da Gula: Belzebu. Bênção: Jejum que Fortalece.
4. **Cidade Imperial — Tesouro** (São Lourenço / Avareza) — *volta* a Forte Sebaste, agora no bairro dos cofres; um prefeito corrupto quer as esmolas da Igreja. Fossa da Avareza: Mamon. Bênção: Fogo que Purifica.
5. **Jardim de Inês** (Santa Inês / Luxúria) — vila anexa ao jardim já existente; um pretendente rejeitado ameaça a paz do lugar. Fossa da Luxúria: Asmodeu. Bênção: Cordeiro Guardião.
6. **Mosteiro de Núrsia** (São Bento / Preguiça) — monastério tomado por um torpor demoníaco; os monges pararam de orar. Fossa da Preguiça: Belfegor. Bênção: Vade Retro (Cruz das Palavras).
   - **Fecho do Ato II**: com os 7 fragmentos reunidos, forja-se Ascalon.
- **Boss do Ato**: Asmodeu, o Carcereiro das Portas *(ou reposicionado ao fim do capítulo 6, a definir na implementação)*.

**ATO III — As Portas do Abismo**
- De volta a Silena. Com Ascalon completa e as sete bênçãos, as Portas se abrem.
- Ecos de **Nicomédia** — cartas, fugitivos, o último edito de Diocleciano — culminam na visita breve à capital ou à sua sombra, reafirmando o que espera Jorge.
- O Dragão retorna em sua forma verdadeira — **a Serpente Antiga** — e oferece a Jorge escapar do martírio que ele sabe que o aguarda em Nicomédia.
- Batalha final em três fases; Ascalon consagrada. Jorge vence não pela força, mas pela recusa da tentação.
- **Epílogo**: Portas fechadas, Silena batizada, Sabra livre, Jorge parte para seu destino — a coroa do martírio. Tela final: a rosa que floresce onde seu sangue cai.

### 2.5 Personagens

| Personagem | Papel | Base |
|---|---|---|
| **Jorge** | Protagonista. Soldado, peregrino, mártir. | São Jorge da Capadócia |
| **Miguel Arcanjo** | Mentor celeste; sonhos e altares. | São Miguel |
| **Sabra** | Princesa de Silena; organiza a resistência da cidade e reaparece por carta ao longo da peregrinação, cobrando notícias e mandando suprimentos. | Lenda Áurea |
| **O Dragão / Serpente Antiga** | Antagonista. Guardião das Portas do Abismo. | Ap 12,9 |
| **Os Sete Santos Mártires** | Espíritos que entregam bênção + fragmento de Ascalon em cada região. | Hagiografias |
| **Diocleciano (sombra)** | Nunca aparece em pessoa até o fim; presente através dos editos lidos por pregoeiros em cada cidade — um fio narrativo contínuo, não só um epílogo surpresa. | História |
| **Rufo, o Ferreiro** | Reaparece em cada hub (mesma pessoa, viaja à frente de Jorge ou tem "parentes" no ofício); reforça a lança com denários e, no fim do Ato II, conduz a forja de Ascalon. | Novo |
| **Prisca, a Mercadora** | Vende poções, pergaminhos e equipamento comum em cada hub. | Novo |
| **Pregoeiro Imperial** | Não é um único NPC fixo — um arquétipo que aparece em cada cidade lendo o edito vigente, cada vez mais duro. | Novo (dispositivo narrativo) |

### 2.6 Inspiração de Lufia II — o que herdamos, em roupagem cristã

*Lufia II: Rise of the Sinistrals* (SNES, 1995) é a referência certa para o problema de escala: um mapa-múndi grande costurando dezenas de cidades e dungeons, cada dungeon com ferramentas próprias usadas tanto em combate quanto em quebra-cabeças (o jogo é, nesse sentido, tão Zelda quanto RPG), um medidor de fúria por dano recebido (**IP Gauge**) que libera um golpe especial, e uma hierarquia de vilões em dois andares: quatro **Sinistrals** (deuses-tiranos, cada um com domínio e sequazes próprios) pairando acima de chefes menores. A tabela abaixo traduz cada peça para a mitologia cristã já em uso no jogo — nada é emprestado literalmente, só a função de design:

| Peça de Lufia II | Função | Equivalente na Lenda Áurea |
|---|---|---|
| Mapa-múndi com dezenas de cidades/dungeons | Escala e ritmo de exploração | **Estradas do Império** ligando Capadócia, Silena e as sete regiões de peregrinação (§2.2) — já coberto na v0.2. |
| **Sinistrals** (4 tiranos, cada um comandando território e subordinados) | Segundo andar de vilania acima dos chefes de dungeon | **Os Quatro Cavaleiros do Apocalipse** (Ap 6) — ver tabela abaixo. Um novo nível de ameaça que aparece nas Estradas do Império, não dentro das fossas. |
| **Capsule Monster** (companheiro de IA que evolui alimentado por itens) | Progressão paralela, companhia constante | **Anjo da Guarda** — um único espírito companheiro concedido por São Miguel no Prólogo, que sobe de patente na hierarquia angélica a cada bênção recebida (ver §3.6). |
| Ferramentas de dungeon (martelo, gancho, bombas — resolvem puzzle *e* atacam) | Puzzles ambientais + combate utilitário | **Instrumentos das Fossas** — cada santo empresta (não dá de presente) um objeto físico usado para atravessar obstáculos daquela e das próximas fossas (ver §3.7). |
| **IP Gauge** (enche com dano recebido, libera golpe especial) | Recompensa por sobreviver sob pressão | Já existe: **Fúria Sagrada**. Nenhuma mudança necessária — a v0.2 só reforça que os Cavaleiros do Apocalipse a enchem mais rápido, tornando esses encontros também os melhores lugares para gastá-la. |
| Ancient Cave (dungeon opcional pós-jogo, 99 andares aleatórios) | Conteúdo pós-game para quem quer mais | *(fora de escopo por ora — anotado como ideia futura, não turno planejado.)* |

**Os Quatro Cavaleiros do Apocalipse** — não substituem os sete Príncipes das Fossas (que seguem a classificação tradicional dos pecados capitais por demônio, atribuída a Peter Binsfeld); ficam **acima** deles, cada um comandando um agrupamento temático e aparecendo como emboscada semi-roteirizada nas Estradas do Império entre capítulos — dá ritmo à peregrinação (evita que ela seja só "andar até a próxima vila") e também resolve o problema de pacing que motivou a v0.2: agora há picos de tensão *entre* as bênçãos, não só dentro delas.

| Cavaleiro | Domínio | Príncipes subordinados | Quando aparece |
|---|---|---|---|
| **Conquista** (coroa, arco, cavalo branco) | Cobiça pelo que é do outro | Leviatã (Inveja) | Estrada para o Porto de Luzia |
| **Guerra** (espada, cavalo vermelho) | Violência e fúria desmedida | Amon (Ira) | Estrada para Forte Sebaste |
| **Fome** (balança, cavalo negro) | Apetites que nunca se saciam | Belzebu (Gula), Mamon (Avareza) | Estrada entre o Ermo de Antão e o Distrito do Tesouro |
| **Morte** (cavalo pálido, Hades a reboque — Ap 6,8) | Torpor e corrupção que levam à ruína final | Belfegor (Preguiça), Asmodeu (Luxúria) | Estrada final, rumo ao Mosteiro de Núrsia |

Derrotar cada Cavaleiro não os mata (são figuras apocalípticas, não monstros comuns) — eles se dissolvem e prometem retornar "quando a hora chegar", e de fato reaparecem juntos, fundidos como arauto da Serpente Antiga, logo antes da batalha final do Ato III. Isso dá ao clímax um vilão de transição que a v0.1 não tinha (o jogo ia direto de Asmodeu para a Serpente).

---

## 3. Gameplay

### 3.1 Movimento e Exploração (Lufia)
- Top-down, 4 direções, mapa em tiles 16×16 (renderizados em 3× = 48px).
- **Estradas do Império**: tela de viagem entre regiões, com encontros leves — o "overworld" que costura o mundo grande.
- Vilas com NPCs e diálogos que **mudam com `world.flags`** conforme a história avança (o sistema de flags já existe no código — `flags.dragaoDerrotado`, `flags.milagres?.raio`, etc. — e passa a ser usado também para atualizar falas de NPCs em cidades já visitadas).
- Dungeons com chaves, alavancas e puzzles simples. Baús e objetos destrutíveis soltam loot.

### 3.2 Combate (God of War)
- Tempo real, no próprio mapa. Ataque leve (combo de espada), ataque pesado (lança — de guarnição, depois Ascalon), esquiva com i-frames, Fúria Sagrada, milagres com custo de Fé.
- *(sem mudanças mecânicas na v0.2 — a diferença é que a lança agora é um item que evolui, não um nome vazio)*.

### 3.3 Loot e Progressão (Diablo)
- Ouro (denários), poções, equipamento com raridades (Comum → Abençoado → Consagrado → Relíquia).
- Slots: arma, escudo, armadura, elmo, medalha. XP e níveis (Força, Fé, Vigor).
- Altares: save/cura, fast-travel entre altares descobertos.
- **Fragmentos de Ascalon**: novo tipo de item de quest, não-vendável, um por bênção, consumidos na forja no Mosteiro de Núrsia.

### 3.4 Inimigos (mitologia cristã)
- Legionários caídos, Imundos, Serpes, Possessos, Príncipes das Fossas (7 mini-bosses temáticos).

### 3.5 Economia e Comércio *(novo)*

O dinário deixa de ser um número sem destino:

- **Prisca, a Mercadora** (uma em cada hub): poções de cura e de fé, pergaminhos utilitários, peças de equipamento comum/abençoado. Também compra loot indesejado do jogador.
- **Rufo, o Ferreiro** (recorrente): upgrades numéricos da lança e reforço de armadura, pagos em denário — barato no início, cada vez mais caro, criando um sumidouro de moeda constante ao longo de toda a jornada.
- **O que não se compra**: fragmentos de Ascalon e milagres. Só se ganham completando o capítulo de cada santo — a moeda resolve poder bruto, a fé resolve a história.
- **Filosofia de preço**: barato no Prólogo/Ato I (o jogador tem pouco), sobe gradualmente a cada região nova, com picos nos upgrades finais de Rufo pouco antes do Mosteiro de Núrsia — dá ao jogador algo para "guardar dinheiro para" na reta final do Ato II.

### 3.6 Anjo da Guarda (companheiro) *(novo, inspirado nos Capsule Monsters)*

- Concedido por São Miguel no Prólogo: uma pequena luz que voa junto a Jorge, ataca sozinha inimigos próximos (fraco, mas constante) e não ocupa slot de equipamento.
- **Evolui por patente**, uma vez por bênção recebida, subindo a hierarquia angélica clássica (Pseudo-Dionísio): **Anjo → Arcanjo → Principado → Virtude → Potestade → Domínio → Querubim/Serafim** (7 saltos para 7 bênçãos — encaixa exato).
- Cada patente nova muda visual (mais asas, mais luz) e função: patentes iniciais só atacam; patentes médias also curam Jorge aos poucos; a patente final (no fecho do Ato II) ganha uma habilidade de proteção ativa — um breve escudo de invencibilidade que se recarrega, ecoando a função de "socorro" que os Capsule Monsters tinham em Lufia II.
- Diferente dos Capsule Monsters (sete criaturas elementais colecionáveis), aqui é **um só companheiro que cresce com Jorge** — reforça o tema de fé pessoal em vez de coleção.

### 3.7 Instrumentos das Fossas (novo, inspirado nas ferramentas de dungeon de Lufia II)

Cada santo empresta um objeto físico que resolve puzzles ambientais naquela fossa **e nas seguintes** (ferramentas se acumulam, como em Lufia/Zelda), além de ter um uso ofensivo secundário:

| Instrumento | Emprestado por | Puzzle que resolve | Uso ofensivo |
|---|---|---|---|
| **Círio de Bárbara** | Santa Bárbara | Ilumina salas escuras nas Catacumbas e além (substitui/expande a tocha já implementada). | Queima teias e raízes que bloqueiam passagem. |
| **Corda de Sebastião** | São Sebastião | Atravessa fossos e puxa alavancas distantes. | Amarra e imobiliza um inimigo por 2s. |
| **Espelho de Luzia** | Santa Luzia | Reflete luz para ativar mecanismos sensíveis a feixes. | Cega e desorienta grupos de inimigos por instantes. |
| **Cajado de Antão** | Santo Antão | Testa/revela chão falso (miragens do deserto viram plataformas reais ou armadilhas). | Repele Possessos com um golpe de recuo. |
| **Balança de Lourenço** | São Lourenço | Ativa mecanismos de peso (pesos e contrapesos no Distrito do Tesouro). | Converte parte do dano recebido em denários (temático: esmola forçada dos inimigos). |
| **Grinalda de Inês** | Santa Inês | Abre portas de jardim que só respondem a algo "puro" carregado pelo jogador. | Cria uma zona que acalma/atordoa inimigos de Luxúria. |
| **Sino de Bento** | São Bento | Desperta mecanismos e monges adormecidos no Mosteiro. | Ondas de choque que repelem hordas ao redor (eco do "Vade Retro"). |

Tecnicamente, cada instrumento é permanente (não se perde ao trocar de fossa), o que dá ao jogador ferramentas cada vez mais numerosas para revisitar regiões antigas — mesmo gancho de design que faz Lufia II (e Zelda) recompensarem o backtracking.

---

## 4. Direção de Arte e Som

- Pixel art 16×16 do Ninja Adventure Pack (CC0, Pixel-boy) — como na v0.1.
- Jorge: túnica branca com a cruz vermelha, capa; a lança muda de aparência visual nos 3 estágios (comum → reforçada → Ascalon com brilho).
- Novas paletas necessárias para as regiões inéditas: guarnição (cinza-aço), porto/farol (azul-sal), deserto (ocre), distrito do tesouro (dourado-sujo), mosteiro (pedra fria) — a definir por região na implementação.
- UI: barras de Vida, Fé e Fúria Sagrada; moldura estilo iluminura medieval.
- Áudio: Web Audio API, chiptune modal — dórico na superfície, frígio nas trevas, tema levemente distinto por região (a definir).

---

## 5. Controles

| Ação | Teclas |
|---|---|
| Mover | WASD / Setas |
| Ataque leve | J / Z |
| Ataque pesado (lança) | K / X |
| Esquiva | Espaço / Shift |
| Fúria Sagrada | L / C |
| Interagir / Falar | E / Enter |
| Milagres | 1–7 |
| Pausa / Inventário | Esc / I |

---

## 6. Roadmap

Turnos 1–11 da v0.1 permanecem como histórico (motor, combate, loot, Ato I completo, 5 das 7 fossas). Os turnos **T12 em diante são substituídos** pelo plano abaixo, que reflete o escopo maior da v0.2. Cada turno termina com commit + push.

**Infraestrutura primeiro (necessária antes de qualquer região nova):**
- [ ] **T12 — Sistema de lança**: item `lanca` em `items.js`/`player.js` com 3 estágios visuais e de dano; lança de guarnição substitui o dano fixo atual do ataque pesado.
- [ ] **T13 — Economia**: NPC mercador genérico reutilizável (Prisca) + NPC ferreiro (Rufo) com loja simples (comprar/vender), fragmentos de Ascalon como novo tipo de item de inventário.
- [ ] **T14 — Estradas do Império**: tela/mapa de viagem simples ligando Silena aos novos hubs, com desbloqueio progressivo de destinos.
- [ ] **T14b — Anjo da Guarda**: companheiro de IA com 7 patentes, concedido no Prólogo, evolui a cada bênção (§3.6).

**Conteúdo (cada capítulo = superfície + fossa + instrumento, ~2 sessões):**
- [ ] **T15 — Forte Sebaste** (superfície) **+ T16 — Fossa da Ira** (já existe, só precisa do novo ponto de entrada, do fragmento/quest da guarnição e da Corda de Sebastião) **+ emboscada do Cavaleiro Guerra** na estrada de chegada.
- [ ] **T17 — Porto de Luzia + T18 — Fossa da Inveja** (idem, reaproveitando a fossa já implementada, Espelho de Luzia) **+ emboscada do Cavaleiro Conquista**.
- [ ] **T19 — Ermo de Antão + T20 — Fossa da Gula** (idem, Cajado de Antão).
- [ ] **T21 — Distrito do Tesouro (volta a Forte Sebaste) + T22 — Fossa da Avareza** (idem, Balança de Lourenço) **+ emboscada do Cavaleiro Fome**.
- [ ] **T23 — Vila do Jardim de Inês + T24 — Fossa da Luxúria** (idem, já existe a fossa, Grinalda de Inês).
- [ ] **T25 — Mosteiro de Núrsia + T26 — Fossa da Preguiça**: príncipe Belfegor, milagre Vade Retro, Sino de Bento, **emboscada do Cavaleiro Morte**, **cena da forja de Ascalon** (fecho do Ato II).
- [x] **T27 — Portas do Abismo**: mapa final do Ato III + os Quatro Cavaleiros fundidos como arauto + Serpente Antiga fases 1–2.
- [x] **T28 — Nicomédia e a Tentação**: eco final do fio de Diocleciano, fase 3 da Serpente, epílogo das rosas, créditos.
- [x] **T29 — Balanceamento e polish final**: curva de dano/vida/preços, tela de vitória.

---

## 7. Arquitetura Técnica

```
index.html          — página única, carrega o jogo
src/
  main.js           — boot, game loop (update/render a 60fps)
  constants.js      — tamanhos, teclas, paleta
  input.js          — teclado (estado pressed/held)
  sprites.js        — pixel art gerada por código (grids de caracteres → canvas)
  map.js            — tiles, colisão, geração do mapa
  camera.js         — câmera com follow suave e clamp
  player.js         — Jorge: movimento, animação, estado
  hud.js            — barras de vida/fé/fúria
  npc.js            — NPCs e diálogo (lines controladas por world.flags)
  maps.js           — definição de cada mapa/região
  items.js / inventory.js — itens, equipamento, raridades
  miracles.js       — milagres/bênçãos
```

**Novos módulos previstos pela v0.2** (a criar durante T12–T14):
```
  spear.js          — estágios da lança (guarnição → reforçada → Ascalon → consagrada)
  economy.js         — mercador/ferreiro, compra/venda, preços por turno da história
  world.js          — Estradas do Império: nós de viagem, desbloqueio progressivo
```

- Sem build, sem dependências: ES modules nativos; abrir `index.html` num servidor local (`python3 -m http.server`) e jogar.
- Sprites definidos como grids de caracteres com paleta — fáceis de editar e versionar.
