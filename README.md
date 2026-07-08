# ⚔️ A Lenda Áurea: Jorge e o Dragão

Action-RPG 2D em pixel art — **Lufia** × **Diablo (1997)** × **God of War** — protagonizado por **Jorge da Capadócia (São Jorge)**, com história inspirada nos santos católicos e na mitologia cristã.

> Século III. As Portas do Abismo se romperam sob a cidade de Silena, e um Dragão exige tributos humanos. Jorge, tribuno romano e cavaleiro de Cristo, recebe de São Miguel Arcanjo a missão de descer às Sete Fossas, reunir as Relíquias dos mártires e fechar as Portas.

## 🎮 Como jogar

Sem build, sem dependências — só um navegador:

```bash
# na raiz do projeto:
python3 -m http.server 8000
# abra http://localhost:8000
```

| Ação | Teclas |
|---|---|
| Mover | WASD / Setas |
| Ataque leve (combo ×3) | J / Z |
| Ataque pesado (lança Ascalon) | K / X |
| Esquiva (i-frames) | Espaço / Shift |
| Fúria Sagrada (com a barra cheia) | L / C |
| Beber poção | Q |
| Milagres (após receber a relíquia) | 1 – 6 |
| Silenciar música e sons | M |
| Inventário | I / Esc |
| Orar no altar (cura + salva o jogo) | E |
| Reerguer-se após cair | Enter |

## 📜 Design

O documento completo de design (história, atos, sistemas, inimigos, roadmap) está em [`docs/GDD.md`](docs/GDD.md).

## 🎨 Arte

Os gráficos usam o **[Ninja Adventure Asset Pack](https://pixel-boy.itch.io/ninja-adventure-asset-pack)** de **Pixel-boy & AAA** (licença CC0 — domínio público): tileset, personagens animados em 4 direções, monstros, itens e efeitos. Detalhes em [`assets/LICENSE.md`](assets/LICENSE.md). O que o pack não cobre (lava, muralhas das fossas, ícones de equipamento) continua gerado por código.

## 🗺️ Estado atual — Turno 7

- [x] Game Design Document
- [x] Motor: game loop, input, câmera com follow suave
- [x] Mapa em tiles com colisão (clareira da Capadócia: floresta, lago, estradas)
- [x] Jorge animado em 4 direções × 4 frames
- [x] **Combate em tempo real**: combo de espada (3 golpes, o último com knockback), lança Ascalon (perfura em linha), esquiva com i-frames
- [x] **Fúria Sagrada**: enche ao dar/receber dano; ativa dano ×2, regeneração e aura dourada
- [x] **Demônios com IA**: Imundos (caçam em bando e dão botes) e Serpes (recuam e cospem veneno)
- [x] Números de dano, partículas, tremor de tela, barra de vida dos inimigos
- [x] Morte e renascimento pela fé (Enter), contador de demônios abatidos
- [x] **Loot estilo Diablo**: drops com raridades (Comum / Abençoado / Consagrado), magnetismo de coleta, denários e poções
- [x] **Inventário e equipamento**: 4 slots (arma, escudo, armadura, medalha) que alteram dano, defesa, vida máxima e ganho de fúria
- [x] **XP e níveis**: demônios dão experiência; subir de nível cura e fortalece
- [x] **Altares**: orar (E) cura por completo e salva a jornada no navegador; a morte preserva o progresso, mas o mal renasce
- [x] **Ato I — quatro mapas conectados por portais**: Clareira da Capadócia → Silena → Pântano Envenenado → Catacumbas dos Mártires
- [x] **NPCs e diálogos estilo Lufia**: Princesa Sabra (a quest da chave), Padre Anastácio, Mira e o Ancião Teodoro
- [x] **Quest da chave**: Gólgor, o Ladrão da Chave (mini-chefe do pântano), o portão trancado das catacumbas
- [x] **Catacumbas**: dungeon na escuridão, iluminada só pela tocha de Jorge, com a Relíquia de Santa Bárbara aguardando
- [x] **Milagres dos santos (Fé como mana)**: Raio do Trovão de Santa Bárbara (tecla 1) e Chuva de Setas de São Sebastião (tecla 2); a Fé regenera com o tempo e a cada demônio abatido
- [x] **Fossa da Ira (Ato II)**: caverna infernal com rios de lava e penumbra avermelhada, descendo das catacumbas
- [x] **Amon, o Furioso**: primeiro chefe de verdade — barra de chefe, investida telegrafada, invocação de servos aos 50% e fúria final aos 30% de vida; sua queda rompe o selo do espírito de São Sebastião
- [x] **O DRAGÃO DE SILENA**: o chefe do Ato I em seu covil a leste do pântano — leque de bolas de fogo, voo com mergulho devastador (imune no ar!), enrage abaixo de 30%, tesouro garantido e a gratidão de Sabra
- [x] **Áudio 100% gerado por código (Web Audio)**: trilha generativa em modos gregorianos — dórico na superfície, drone frígio nas trevas, arpejo acelerado nos chefes — e efeitos para golpes, milagres, oração e o rugido da besta (M silencia)
- [x] **Tela de título** com a cruz, controles e continuação da jornada salva
- [x] **Repaginação visual (Turno 7)**: arte profissional CC0 do Ninja Adventure Pack — cavaleiro com elmo, NPCs únicos, demônios expressivos, dragão animado, tileset novo, árvores e casas com profundidade (o jogador passa por trás) e golpes com sprites de efeito

- [x] **T8 — Fossa da Inveja**: galeria verde-cobiça sob a Fossa da Ira, Invejosos, o príncipe **Leviatã** (invoca ao perder metade da vida) e o espírito de **Santa Luzia** com a *Luz que Cega* (tecla 3 — atordoa todos os malignos próximos com um clarão)

- [x] **T9 — Fossa da Gula**: o salão do banquete com a mesa interminável e caldeirões de fogo, Possessos que explodem em miasma ao morrer, o príncipe **Belzebu** e o espírito de **Santo Antão** com o *Jejum que Fortalece* (tecla 4 — escudo de +6 de defesa por 9s)

- [x] **T10 — Fossa da Avareza**: o grande cofre com moedas perdidas no piso, o príncipe **Mamon** (sangra denários a cada ferida — a avareza punida) e o espírito de **São Lourenço** com o *Fogo que Purifica* (tecla 5 — nova de fogo em anel, 28 de dano em área)

- [x] **T11 — Fossa da Luxúria**: o jardim das delícias com piso de pétalas, o príncipe **Asmodeu** (a sedução puxa Jorge para o abraço da morte — esquive para resistir) e o espírito de **Santa Inês** com o *Cordeiro Guardião* (tecla 6 — aliado alvo e leal que morde os malignos por 14s)

O roadmap detalhado dos passos T12–T15 (um por sessão, cada um com commit) está no [`docs/GDD.md`](docs/GDD.md). Próximo: **T12 — Fossa da Preguiça** (príncipe Belfegor + São Bento, fecho do Ato II).
