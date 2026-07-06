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
| Milagres (após receber a relíquia) | 1 / 2 |
| Silenciar música e sons | M |
| Inventário | I / Esc |
| Orar no altar (cura + salva o jogo) | E |
| Reerguer-se após cair | Enter |

## 📜 Design

O documento completo de design (história, atos, sistemas, inimigos, roadmap) está em [`docs/GDD.md`](docs/GDD.md).

## 🗺️ Estado atual — Turno 6

- [x] Game Design Document
- [x] Motor: game loop, input, câmera com follow suave
- [x] Mapa em tiles com colisão (clareira da Capadócia: floresta, lago, estradas)
- [x] Pixel art 100% gerada por código (sem assets externos)
- [x] Jorge animado em 4 direções
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

Próximo (**Turno 7+**): as seis Fossas restantes com seus príncipes e relíquias, o Ato III nas Portas do Abismo, a Serpente Antiga e o epílogo das rosas.
