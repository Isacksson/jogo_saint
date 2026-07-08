# A LENDA ÁUREA: Jorge e o Dragão
### Game Design Document — v0.1

> *"Não temas, pois eu estou contigo."* — Isaías 41:10

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

- **Lufia**: exploração top-down em pixel art, vilas e NPCs, dungeons com puzzles, tom de JRPG clássico.
- **Diablo (1997)**: loot com raridades, dungeons que descem em direção ao mal, atmosfera de escuridão crescente, hordas de demônios.
- **God of War**: combate visceral em tempo real, combos, esquiva, medidor de **Fúria Sagrada**, chefes monumentais, um guerreiro movido por um propósito maior que ele.

---

## 2. História

### Premissa

Século III. O Império Romano persegue os cristãos, mas algo pior desperta sob a terra: as **Portas do Abismo** se romperam na cidade de **Silena**, na Líbia, e um **Dragão** — não uma besta, mas um príncipe das legiões caídas — exige tributos humanos em troca de poupar a cidade.

**Jorge**, tribuno romano da Capadócia e cristão secreto, recebe em sonho a visita de **São Miguel Arcanjo**, que lhe entrega uma missão: descer até as raízes do mal, fechar as Portas do Abismo e enfrentar o Dragão. Sua lança, **Ascalon**, é forjada ao longo da jornada com relíquias dos santos e mártires que o precederam.

### Estrutura em 3 Atos

**ATO I — A Cidade do Dragão (Silena)**
- Jorge chega a Silena e encontra a cidade sob o terror do tributo: a próxima vítima sorteada é a princesa **Sabra**.
- Explora a vila, os pântanos envenenados pelo hálito da besta e as catacumbas dos primeiros mártires.
- Primeiro confronto com o Dragão — Jorge o fere e o encurrala, mas descobre que a besta é apenas o guardião das Portas. Matá-lo sem fechá-las apenas libertaria o que está abaixo.
- **Boss do Ato**: O Dragão de Silena (1ª forma).

**ATO II — A Descida (as Sete Fossas)**
- Estrutura Diablo: sete níveis de dungeon descendo sob a terra, cada um tematizado num **pecado capital** e guardado por um demônio-príncipe.
- Em cada fossa, Jorge encontra o espírito de um santo mártir que lhe confia uma **Relíquia** (novo poder/milagre):
  - **Santa Bárbara** (fossa da Ira) — o *Raio do Trovão*
  - **São Sebastião** (fossa da Inveja) — a *Chuva de Setas*
  - **Santo Antão** (fossa da Gula) — o *Jejum que Fortalece* (resistência)
  - **Santa Luzia** (fossa da Soberba) — a *Luz que Cega os Malignos*
  - **São Lourenço** (fossa da Avareza) — o *Fogo que Purifica*
  - **Santa Inês** (fossa da Luxúria) — o *Cordeiro Guardião* (aliado invocado)
  - **São Bento** (fossa da Preguiça) — a *Cruz das Palavras* (escudo sagrado, "Vade Retro")
- **Boss do Ato**: Asmodeu, o Carcereiro das Portas.

**ATO III — As Portas do Abismo**
- Com Ascalon completa e as sete Relíquias, Jorge alcança as Portas.
- O Dragão retorna em sua forma verdadeira — **a Serpente Antiga** — e revela a tentação final: desistir da luta em troca de escapar do próprio martírio que Jorge sabe que o espera em Nicomédia.
- Batalha final em três fases. Jorge vence não apenas pela força, mas pela recusa da tentação — ecoando o "não" dos mártires.
- **Epílogo**: Jorge fecha as Portas, batiza Silena, liberta Sabra e parte para seu destino — a coroa do martírio. A tela final mostra a rosa que floresce onde seu sangue cai (lenda das rosas de São Jorge).

### Personagens

| Personagem | Papel | Base |
|---|---|---|
| **Jorge** | Protagonista. Soldado, cavaleiro, mártir. | São Jorge da Capadócia |
| **Miguel Arcanjo** | Mentor celeste; aparece em sonhos e altares. Tutorial e hub de milagres. | São Miguel |
| **Sabra** | Princesa de Silena; não é donzela passiva — organiza a resistência da cidade. | Lenda Áurea |
| **O Dragão / Serpente Antiga** | Antagonista. Guardião das Portas do Abismo. | Ap 12,9 |
| **Os Sete Santos Mártires** | Espíritos que entregam as Relíquias nas Sete Fossas. | Hagiografias |
| **Diocleciano (sombra)** | Presença que assombra Jorge: o martírio que o espera. | História |

---

## 3. Gameplay

### 3.1 Movimento e Exploração (Lufia)
- Top-down, 4 direções, mapa em tiles 16×16 (renderizados em 3× = 48px).
- Vilas com NPCs e diálogos; dungeons com chaves, alavancas e puzzles simples.
- Baús, objetos destrutíveis (potes, caixas) que soltam loot.

### 3.2 Combate (God of War)
- **Tempo real, no próprio mapa** (sem tela de batalha separada).
- **Ataque leve** (J / Z): combo de 3 golpes de espada; o 3º causa knockback.
- **Ataque pesado** (K / X): investida com a lança Ascalon; perfura em linha.
- **Esquiva** (Espaço / Shift): rolamento com invencibilidade breve (i-frames).
- **Fúria Sagrada**: barra que enche ao causar/receber dano. Cheia, ativa (L / C) um estado temporário: dano dobrado, golpes com luz, vida regenerando lentamente.
- **Milagres** (Relíquias): habilidades ativas com custo de **Fé** (mana), obtidas dos santos.

### 3.3 Loot e Progressão (Diablo)
- Inimigos e baús soltam: ouro (denários), poções, equipamento.
- **Raridades**: Comum (branco) → Abençoado (azul) → Consagrado (dourado) → Relíquia (único, de santos).
- Slots: arma, escudo, armadura, elmo, medalha (amuleto).
- **XP e níveis**: atributos Força, Fé, Vigor.
- **Altares**: pontos de save/cura espalhados pelo mundo (orar salva o jogo) — também servem de fast-travel entre altares descobertos.

### 3.4 Inimigos (mitologia cristã)
- **Legionários caídos** — soldados corrompidos (melee básico).
- **Imundos** — demônios menores, rápidos e fracos, atacam em bando (Diablo fallen).
- **Serpes** — crias do Dragão, cospem veneno à distância.
- **Possessos** — lentos e fortes, explodem em miasma ao morrer.
- **Príncipes das Fossas** — 7 mini-bosses temáticos dos pecados capitais.

---

## 4. Direção de Arte e Som

- **Pixel art 16×16 do Ninja Adventure Pack (CC0, Pixel-boy)** — personagens 4 direções × 4 frames, cenografia com profundidade (árvores e casas que o jogador atravessa por trás); paleta clara na superfície, escurecendo a cada fossa até o negro-vermelho do Abismo. Lacunas do pack (lava, muralhas, ícones) seguem procedurais.
- Jorge: túnica branca com a cruz vermelha, capa, lança.
- UI: barras de Vida (vermelho), Fé (azul) e Fúria Sagrada (dourado); moldura estilo iluminura medieval.
- **Áudio**: Web Audio API — chiptune modal (tons gregorianos) na superfície, drones graves nas fossas. (Turno 6.)

---

## 5. Controles

| Ação | Teclas |
|---|---|
| Mover | WASD / Setas |
| Ataque leve | J / Z |
| Ataque pesado | K / X |
| Esquiva | Espaço / Shift |
| Fúria Sagrada | L / C |
| Interagir / Falar | E / Enter |
| Milagres | 1–7 |
| Pausa / Inventário | Esc / I |

---

## 6. Roadmap por Turnos

Cada turno termina com **commit + push** — o trabalho nunca fica pela metade no repositório.

- [x] **Turno 1** — GDD + protótipo: mapa, câmera, colisão, Jorge andando (4 direções, animado), HUD básico.
- [x] **Turno 2** — Combate: combo de espada, lança, esquiva com i-frames, inimigos (Imundo, Serpe) com IA, dano/morte, Fúria Sagrada.
- [x] **Turno 3** — Loot (raridades, drops), inventário/equipamento, XP/níveis, altares (save).
- [x] **Turno 4** — Ato I: vila de Silena, NPCs e diálogos, pântano, catacumbas (dungeon 1 com chave/porta).
- [x] **Turno 5** — Milagres/Relíquias (Raio do Trovão, Chuva de Setas), Fossa da Ira com o príncipe Amon.
- [x] **Turno 6** — Boss Dragão de Silena, áudio (Web Audio), tela de título, polish.
- [x] **Turno 7** — Repaginação visual: assets profissionais CC0 (Ninja Adventure Pack), cenografia com profundidade, FX de golpe em sprite.
- [ ] **Turnos 7+** — Fossas restantes, Ato III, Serpente Antiga, epílogo.

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
```

- **Sem build, sem dependências**: ES modules nativos; abrir `index.html` num servidor local (`python3 -m http.server`) e jogar.
- Sprites definidos como grids de caracteres com paleta — fáceis de editar e versionar.
