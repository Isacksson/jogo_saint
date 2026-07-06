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
| Ataque leve | J / Z *(Turno 2)* |
| Ataque pesado | K / X *(Turno 2)* |
| Esquiva | Espaço / Shift *(Turno 2)* |
| Fúria Sagrada | L / C *(Turno 2)* |

## 📜 Design

O documento completo de design (história, atos, sistemas, inimigos, roadmap) está em [`docs/GDD.md`](docs/GDD.md).

## 🗺️ Estado atual — Turno 1

- [x] Game Design Document
- [x] Motor: game loop, input, câmera com follow suave
- [x] Mapa em tiles com colisão (clareira da Capadócia: floresta, lago, estradas)
- [x] Pixel art 100% gerada por código (sem assets externos)
- [x] Jorge animado em 4 direções
- [x] HUD: Vida, Fé e Fúria Sagrada

Próximo (**Turno 2**): combate em tempo real — combos de espada, lança Ascalon, esquiva com i-frames e primeiros demônios.
