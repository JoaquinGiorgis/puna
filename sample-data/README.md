# sample-data

- `lot14_grid.npz`: grilla 12×12 **real**: focos VIIRS de un incendio en Anta, Salta (8–11/11/2026). Índice honesto 3.777 bps.
  ```bash
  python -m orbit.firms grid --csv sample-data/firms_anta.csv --bbox -62.9370,-25.0760,-62.9020,-25.0410 --out sample-data/lot14_grid.npz
  ```
  Caja de ~3,9 km (celdas de ~325 m, del orden del píxel VIIRS de 375 m). La grilla sintética vieja sigue disponible con `grid --demo`.
- `firms_anta.csv`: respuestas de la API de área (VIIRS_NOAA20_NRT + VIIRS_NOAA21_NRT, bbox `-63.2,-25.3,-62.6,-24.8`, 4 ventanas de 5 días, sin duplicados).
- `firms_*.csv`: respuestas guardadas de la API de área de FIRMS (para correr sin red).
- `tle/orbit07.tle` (NOAA 20, NORAD 43013) y `tle/orbit03.tle` (NOAA 21, NORAD 54234): TLE de CelesTrak GP bajados el 11/11/2026 (época 26315), proxies reales de los nodos simulados. En la ventana de la demo (2026-11-12T15:30Z, 9 min), ORBIT-07 da 10.000 bps (dentro de la Anomalía) y ORBIT-03 da 0.
