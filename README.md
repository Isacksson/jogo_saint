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
| Reerguer-se após cair | Enter |

## 📜 Design

O documento completo de design (história, atos, sistemas, inimigos, roadmap) está em [`docs/GDD.md`](docs/GDD.md).

## 🗺️ Estado atual — Turno 2

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

Próximo (**Turno 3**): loot com raridades, inventário/equipamento, XP/níveis e altares de save.
