# 全库比例审计（404 个资产）

## 记录在案的 px/m 分布

| px/m | 1 px ≈ | 资产数 |
|---|---|---|
| 12 | 8.33 cm | 401 |
| 37 | 2.70 cm | 1 |
| 53 | 1.89 cm | 1 |
| 75 | 1.33 cm | 1 |

## 按真实高度反推 px/m（地标类）

| 资产 | 层数 | 真实高 | 反推 px/m | 若按 12px/m 的高度 |
|---|---|---|---|---|
| 06_roppongi_mori | 367 | 238 m | **1.54** | 31 m |
| 07_roppongi_midtown | 386 | 248 m | **1.56** | 32 m |
| 08_roppongi_izumi | 311 | 201 m | **1.55** | 26 m |
| 11_odaiba_fuji | 196 | 123 m | **1.59** | 16 m |
| 14_gundam | 238 | 18 m | **13.22** | 20 m |
| 27_ferris_wheel | 192 | 115 m | **1.67** | 16 m |
| 01_himeji | 356 | 46 m | **7.74** | 30 m |
| 03_nagoya | 395 | 48 m | **8.23** | 33 m |
| 20_tsutenkaku | 164 | 108 m | **1.52** | 14 m |
| 21_umeda_sky | 261 | 173 m | **1.51** | 22 m |
| 22_abeno_harukas | 310 | 300 m | **1.03** | 26 m |
| 23_kyoto_tower | 199 | 131 m | **1.52** | 17 m |
| 24_kobe_port_tower | 164 | 108 m | **1.52** | 14 m |
| 29_akashi_bridge | 303 | 298 m | **1.02** | 25 m |
| 01_tokyo_tower | 670 | 333 m | **2.01** | 56 m |
| 02_skytree | 953 | 634 m | **1.5** | 79 m |
| 09_tokyo_station | 381 | 46 m | **8.28** | 32 m |
| 10_diet_building | 789 | 65 m | **12.14** | 66 m |
| 11_big_sight | 381 | 58 m | **6.57** | 32 m |
| 12_rainbow_bridge | 194 | 126 m | **1.54** | 16 m |
| 19_airport | 499 | 50 m | **9.98** | 42 m |

## 非 12 px/m 的资产（按记录）

| 资产 | px/m | 层数 | 折算高 | 来源 |
|---|---|---|---|---|
| S | 37 | 56 | 1.51 m | params.px_per_m |
| M | 53 | 80 | 1.51 m | params.px_per_m |
| L | 75 | 112 | 1.49 m | params.px_per_m |

## 分组统计

- 01_konbini: 1
- 02_mansion: 1
- 03_office: 1
- 04_machiya: 1
- 05_sento: 1
- 06_shrine: 1
- 07_pagoda: 1
- 08_izakaya: 1
- 09_pachinko: 1
- 10_wooden-apt: 1
- 11_hotel: 1
- 12_department: 1
- 13_station: 1
- 14_school: 1
- 15_hospital: 1
- 16_factory: 1
- 17_warehouse: 1
- 18_tower-mansion: 1
- 19_gas-station: 1
- 20_koban: 1
- assets\sample_torii: 1
- assets\sample_tower: 1
- extra\01_pedestrian_bridge: 1
- extra\02_guard_rail: 1
- extra\03_road_sign_large: 1
- extra\04_road_sign_small: 1
- extra\05_parking_building: 1
- extra\06_roppongi_mori: 1
- extra\07_roppongi_midtown: 1
- extra\08_roppongi_izumi: 1
- extra\09_billboard_brand: 1
- extra\10_subway_entrance_v2: 1
- extra\11_odaiba_fuji: 1
- extra\12_odaiba_aqua: 1
- extra\13_odaiba_palette: 1
- extra\14_gundam: 1
- extra\15_interchange_straight: 1
- extra\16_interchange_curve: 1
- extra\17_interchange_ramp: 1
- extra\18_interchange_junction: 1
- extra\19_fire_truck: 1
- extra\20_garbage_truck: 1
- extra\21_delivery_truck: 1
- extra\22_excavator: 1
- extra\23_cement_mixer: 1
- extra\24_rickshaw: 1
- extra\25_yamanote_train: 1
- extra\26_yurikamome: 1
- extra\27_ferris_wheel: 1
- extra\28_fire_hydrant: 1
- extra\29_recycling_station: 1
- extra\30_bike_parking: 1
- extra\31_ticket_gate: 1
- extra\32_ticket_machine: 1
- extra\33_atm: 1
- extra\34_street_lamp: 1
- extra\35_bench: 1
- extra\36_trash_bin: 1
- extra\37_jizo: 1
- extra\38_fountain: 1
- green\01_sakura: 1
- green\02_ginkgo: 1
- green\03_pine: 1
- green\04_maple: 1
- green\05_bamboo: 1
- green\06_plum: 1
- green\07_wisteria: 1
- green\08_willow: 1
- green\09_cedar: 1
- green\10_cycad: 1
- green\11_street_planter: 1
- green\12_hedge_row: 1
- green\13_flower_bed: 1
- green\14_green_wall: 1
- green\15_rooftop_garden: 1
- green\16_planter_boxes: 1
- green\17_lawn: 1
- green\18_pergola: 1
- green\19_shrub_balls: 1
- green\20_road_median: 1
- japan\01_himeji: 1
- japan\02_osaka: 1
- japan\03_nagoya: 1
- japan\04_matsumoto: 1
- japan\05_kumamoto: 1
- japan\06_shuri: 1
- japan\07_kinkakuji: 1
- japan\08_ginkakuji: 1
- japan\09_kiyomizudera: 1
- japan\10_byodoin: 1
- japan\11_todaiji: 1
- japan\12_horyuji: 1
- japan\13_itsukushima: 1
- japan\14_nikko_toshogu: 1
- japan\15_izumo_taisha: 1
- japan\16_ise_jingu: 1
- japan\17_chusonji: 1
- japan\18_kamakura_daibutsu: 1
- japan\19_dogo_onsen: 1
- japan\20_tsutenkaku: 1
- japan\21_umeda_sky: 1
- japan\22_abeno_harukas: 1
- japan\23_kyoto_tower: 1
- japan\24_kobe_port_tower: 1
- japan\25_sapporo_clock: 1
- japan\26_goryokaku: 1
- japan\27_yokohama_redbrick: 1
- japan\28_kanazawa_tsuzumi: 1
- japan\29_akashi_bridge: 1
- japan\30_atomic_dome: 1
- landmarks\01_tokyo_tower: 1
- landmarks\02_skytree: 1
- landmarks\03_kaminarimon: 1
- landmarks\04_otorii: 1
- landmarks\05_sensoji_hall: 1
- landmarks\06_meiji_jingu: 1
- landmarks\07_fushimi_yagura: 1
- landmarks\08_nijubashi: 1
- landmarks\09_tokyo_station: 1
- landmarks\10_diet_building: 1
- landmarks\11_big_sight: 1
- landmarks\12_rainbow_bridge: 1
- miku\L: 1
- miku\M: 1
- miku\S: 1
- more\01_castle: 1
- more\02_gassho: 1
- more\03_inari: 1
- more\04_ryokan: 1
- more\05_sake: 1
- more\06_kabuki: 1
- more\07_budokan: 1
- more\08_samurai: 1
- more\09_danchi: 1
- more\10_church: 1
- more\11_library: 1
- more\12_museum: 1
- more\13_fire: 1
- more\14_post: 1
- more\15_bank: 1
- more\16_supermarket: 1
- more\17_gamecenter: 1
- more\18_parking: 1
- more\19_airport: 1
- more\20_highway_sa: 1
- oldv2_build\.look_j\scratch02: 1
- props2\apron_bus: 1
- props2\apron_bus_long: 1
- props2\baggage_tractor: 1
- props2\baggage_tractor_train: 1
- props2\barn: 1
- props2\barn_silo: 1
- props2\buffer_stop: 1
- props2\buffer_stop_sled: 1
- props2\bulldozer: 1
- props2\bulldozer_orange: 1
- props2\catenary_pole: 1
- props2\catenary_pole_cantilever: 1
- props2\climbing_frame: 1
- props2\climbing_frame_dome: 1
- props2\coffee_cart: 1
- props2\coffee_cart_mint: 1
- props2\coffee_cart_yoi: 1
- props2\concrete_pump: 1
- props2\concrete_pump_long: 1
- props2\container_ship: 1
- props2\container_ship_long: 1
- props2\container_yard: 1
- props2\container_yard_deep: 1
- props2\crawler_crane: 1
- props2\crawler_crane_steel: 1
- props2\dashi_float: 1
- props2\dashi_float_kin: 1
- props2\dashi_float_yoi: 1
- props2\deicing_truck: 1
- props2\deicing_truck_tall: 1
- props2\etc_gantry: 1
- props2\etc_gantry_tube: 1
- props2\farmhouse: 1
- props2\farmhouse_thatch: 1
- props2\fuel_truck: 1
- props2\fuel_truck_hose: 1
- props2\gantry_crane: 1
- props2\gantry_crane_blue: 1
- props2\gas_sphere: 1
- props2\gas_sphere_twin: 1
- props2\greenhouse: 1
- props2\greenhouse_venlo: 1
- props2\icecream_truck: 1
- props2\icecream_truck_berry: 1
- props2\icecream_truck_yoi: 1
- props2\jet_bridge: 1
- props2\jet_bridge_short: 1
- props2\lantern_frame: 1
- props2\lantern_frame_kin: 1
- props2\lantern_frame_yoi: 1
- props2\mikoshi: 1
- props2\mikoshi_kin: 1
- props2\mikoshi_yoi: 1
- props2\mini_train: 1
- props2\mini_train_diesel: 1
- props2\overpass: 1
- props2\overpass_ramp: 1
- props2\patrol_boat: 1
- props2\patrol_boat_large: 1
- props2\platform_shelter: 1
- props2\platform_shelter_side: 1
- props2\ramen_stand: 1
- props2\ramen_stand_shio: 1
- props2\ramen_stand_yoi: 1
- props2\rice_paddy: 1
- props2\rice_paddy_terrace: 1
- props2\road_roller: 1
- props2\road_roller_red: 1
- props2\sandbox: 1
- props2\sandbox_round: 1
- props2\scarecrow: 1
- props2\scarecrow_crow: 1
- props2\signal_mast: 1
- props2\signal_mast_arm: 1
- props2\slide: 1
- props2\slide_toddler: 1
- props2\solar_array: 1
- props2\solar_array_canopy: 1
- props2\station_sign: 1
- props2\station_sign_routemap: 1
- props2\substation: 1
- props2\substation_compact: 1
- props2\swing: 1
- props2\swing_toddler: 1
- props2\taiko_dai: 1
- props2\taiko_dai_kin: 1
- props2\taiko_dai_yoi: 1
- props2\takoyaki_cart: 1
- props2\takoyaki_cart_negi: 1
- props2\takoyaki_cart_yoi: 1
- props2\toll_gate: 1
- props2\toll_gate_mixed: 1
- props2\tower_crane: 1
- props2\tower_crane_red: 1
- props2\tunnel_portal: 1
- props2\tunnel_portal_box: 1
- props2\vms_board: 1
- props2\vms_board_twin: 1
- props2\water_tower: 1
- props2\water_tower_legs: 1
- props2\wind_turbine: 1
- props2\wind_turbine_lattice: 1
- props2\yacht: 1
- props2\yacht_flagship: 1
- props2\yakitori_stall: 1
- props2\yakitori_stall_shio: 1
- props2\yakitori_stall_yoi: 1
- props2\yatai_stall: 1
- props2\yatai_stall_ao: 1
- props2\yatai_stall_kin: 1
- street\01_taxi: 1
- street\02_bus: 1
- street\03_kei_truck: 1
- street\04_kei_car: 1
- street\05_sedan: 1
- street\06_scooter: 1
- street\07_bicycle: 1
- street\08_shinkansen: 1
- street\09_police_car: 1
- street\10_ambulance: 1
- street\11_vending: 1
- street\12_phone_booth: 1
- street\13_bus_stop: 1
- street\14_traffic_light: 1
- street\15_utility_pole: 1
- street\16_post_box: 1
- street\17_coin_locker: 1
- street\18_public_toilet: 1
- street\19_curve_mirror: 1
- street\20_subway_entrance: 1
- street\21_cherry_tree: 1
- street\22_ginkgo_tree: 1
- street\23_stone_lantern: 1
- street\24_neon_sign: 1
- street2\ameyoko: 1
- street2\capsule_hotel_tower: 1
- street2\chain_storefront: 1
- street2\chain_storefront_drug: 1
- street2\chain_storefront_gyudon: 1
- street2\chain_storefront_ramen: 1
- street2\coin_parking: 1
- street2\coin_parking_max: 1
- street2\coin_parking_small: 1
- street2\coin_parking_tight: 1
- street2\construction_site: 1
- street2\construction_site_green_mesh: 1
- street2\construction_site_grey_compact: 1
- street2\construction_site_navy_net: 1
- street2\don_quijote: 1
- street2\golden_gai_yokocho: 1
- street2\guard_shita_yokocho: 1
- street2\kabukicho_gate: 1
- street2\nobori_banners: 1
- street2\nobori_banners_long: 1
- street2\nobori_banners_quiet: 1
- street2\nobori_banners_sale: 1
- street2\overhead_wires: 1
- street2\overhead_wires_clean: 1
- street2\overhead_wires_dense: 1
- street2\overhead_wires_long: 1
- street2\railway_crossing: 1
- street2\railway_crossing_double: 1
- street2\railway_crossing_narrow: 1
- street2\railway_crossing_wide: 1
- street2\shibuya_scramble: 1
- street2\shotengai_arcade: 1
- street2\shotengai_arcade_flat: 1
- street2\shotengai_arcade_no_gate: 1
- street2\shotengai_arcade_vault: 1
- street2\station_bus_terminal: 1
- street2\station_bus_terminal_compact: 1
- street2\station_bus_terminal_full: 1
- street2\tenant_sign_stack: 1
- street2\tenant_sign_stack_front_off: 1
- street2\tenant_sign_stack_side_mono: 1
- street2\tenant_sign_stack_side_showa: 1
- street2\viaduct_undertrack: 1
- street2\viaduct_undertrack_clean_4arch: 1
- street2\viaduct_undertrack_grand_2arch: 1
- street2\viaduct_undertrack_narrow_3arch: 1
- veh2\apc: 1
- veh2\apc_desert: 1
- veh2\apc_un: 1
- veh2\commuter_train: 1
- veh2\commuter_train_chuo: 1
- veh2\commuter_train_keio: 1
- veh2\convertible: 1
- veh2\convertible_livery_blue: 1
- veh2\convertible_livery_silver: 1
- veh2\convertible_livery_white: 1
- veh2\fr_coupe: 1
- veh2\fr_coupe_livery_black: 1
- veh2\fr_coupe_livery_blue: 1
- veh2\fr_coupe_livery_red: 1
- veh2\freight_loco: 1
- veh2\freight_loco_ef210: 1
- veh2\freight_loco_eh500: 1
- veh2\freighter_aircraft: 1
- veh2\freighter_aircraft_quad: 1
- veh2\freighter_aircraft_yellow: 1
- veh2\gt_coupe: 1
- veh2\gt_coupe_livery_black: 1
- veh2\gt_coupe_livery_r34: 1
- veh2\gt_coupe_livery_white: 1
- veh2\helicopter: 1
- veh2\helicopter_police: 1
- veh2\helicopter_sar: 1
- veh2\light_tank: 1
- veh2\light_tank_desert: 1
- veh2\light_tank_urban: 1
- veh2\limited_express: 1
- veh2\limited_express_nex: 1
- veh2\limited_express_shimakaze: 1
- veh2\mbt: 1
- veh2\mbt_desert: 1
- veh2\mbt_winter: 1
- veh2\monorail: 1
- veh2\monorail_osaka: 1
- veh2\monorail_shonan: 1
- veh2\mr_supercar: 1
- veh2\mr_supercar_livery_silver: 1
- veh2\mr_supercar_livery_white: 1
- veh2\mr_supercar_livery_yellow: 1
- veh2\narrowbody_airliner: 1
- veh2\narrowbody_airliner_crimson: 1
- veh2\narrowbody_airliner_sakura: 1
- veh2\people_mover: 1
- veh2\people_mover_portliner: 1
- veh2\people_mover_seaside: 1
- veh2\prop_plane: 1
- veh2\prop_plane_navy: 1
- veh2\prop_plane_ochre: 1
- veh2\retro_sports: 1
- veh2\retro_sports_livery_blue: 1
- veh2\retro_sports_livery_cream: 1
- veh2\retro_sports_livery_red: 1
- veh2\seaplane: 1
- veh2\seaplane_sky: 1
- veh2\seaplane_sunset: 1
- veh2\spaag: 1
- veh2\spaag_desert: 1
- veh2\spaag_urban: 1
- veh2\spg: 1
- veh2\spg_desert: 1
- veh2\spg_winter: 1
- veh2\subway_train: 1
- veh2\subway_train_marunouchi: 1
- veh2\subway_train_oedo: 1
- veh2\tram: 1
- veh2\tram_orange: 1
- veh2\tram_twin: 1
- veh2\widebody_airliner: 1
- veh2\widebody_airliner_crimson: 1
- veh2\widebody_airliner_jade: 1
- veh2\widebody_tuner: 1
- veh2\widebody_tuner_livery_black: 1
- veh2\widebody_tuner_livery_blue: 1
- veh2\widebody_tuner_livery_pink: 1
