# Changelog

## 1.0.0 (2026-04-14)


### Features

* add Railway deployment config and Neon SSL support ([de27036](https://github.com/Josecanihuante/novanetsuiterp/commit/de27036cf1c5135531cd217b1d544e6c847eee6e))
* add Render deployment config and update Neon SSL support ([a575a00](https://github.com/Josecanihuante/novanetsuiterp/commit/a575a0006565b72b8a75ebcce6c443231d32a059))
* complete ERP implementation - all modules backend + frontend + deploy ([6c537bf](https://github.com/Josecanihuante/novanetsuiterp/commit/6c537bf05ea528cd6e82e23517d03d5420f4ba9c))
* contabilizacion automatica facturas + importacion RCV SII ([d490b33](https://github.com/Josecanihuante/novanetsuiterp/commit/d490b33654ba7ecdf3b979b2606cbf439a04daf5))
* integracion DTE SII Chile - arquitectura base ([29231fb](https://github.com/Josecanihuante/novanetsuiterp/commit/29231fb5459dca1c6dc19d1a3ebedc5635c98e0d))
* módulo factura chilena con generación PDF ([5839dea](https://github.com/Josecanihuante/novanetsuiterp/commit/5839deaf590698a6f429837b8125ac820119915e))
* multi-tenant user management — roles en español, company_id ([d5808f5](https://github.com/Josecanihuante/novanetsuiterp/commit/d5808f54d4e611ba54966decbb61a7f6afab05a8))


### Bug Fixes

* actualizar urls a instancia novanetsuiterp-1 y login form data ([05c68d3](https://github.com/Josecanihuante/novanetsuiterp/commit/05c68d3954ff6c2d6e0820cfc4351ac001b0234e))
* add Vercel SPA routing rewrite ([784cdec](https://github.com/Josecanihuante/novanetsuiterp/commit/784cdec343d4bc685e1d677b6941ab304215f041))
* add Vite env typings ([3a13ff5](https://github.com/Josecanihuante/novanetsuiterp/commit/3a13ff5da8a416bf5ad6879b05d7d7c6f474df49))
* auth login form-urlencoded + correct response mapping ([d2e4494](https://github.com/Josecanihuante/novanetsuiterp/commit/d2e4494124ea0afea745b264e412adaf95728bcd))
* ColumnType error in Invoices DTE column ([8482244](https://github.com/Josecanihuante/novanetsuiterp/commit/84822445cdd40a92e74366f27afc8fe3e280d802))
* convert UUID to str before JWT encoding ([25b2987](https://github.com/Josecanihuante/novanetsuiterp/commit/25b298724012ffbd72c46bfa2bfce7be0b0b8b7b))
* corregir URL base de login para producción en vercel ([5666a92](https://github.com/Josecanihuante/novanetsuiterp/commit/5666a927673be3f3b12622f80385aca22e0d093d))
* CORS allow all Vercel preview URLs via regex ([27683c2](https://github.com/Josecanihuante/novanetsuiterp/commit/27683c29c972efc39011fc605f99d7e80a177cd6))
* CORS regex for all Vercel URLs ([152cc03](https://github.com/Josecanihuante/novanetsuiterp/commit/152cc03acc89cde3f123e2f80894f1685c456f94))
* **cors:** agregar dominio correcto de vercel y actualizar render.yaml ([7ca799a](https://github.com/Josecanihuante/novanetsuiterp/commit/7ca799a85bc9fd704b9f081af238791200dd34ea))
* **env:** apuntar VITE_API_URL a la nueva instancia novanetsuiterp-3 ([0e5809d](https://github.com/Josecanihuante/novanetsuiterp/commit/0e5809dea9d6150a1c34f71e55a734dc0bdf7728))
* hardcode API_BASE to avoid double /api/v1 prefix ([479ccf7](https://github.com/Josecanihuante/novanetsuiterp/commit/479ccf7c5e1292b2b8149d69692a2c6426cd8bbb))
* pin bcrypt 4.0.1 to fix passlib 72 bytes error ([9f5823c](https://github.com/Josecanihuante/novanetsuiterp/commit/9f5823c930d204e997bba24f6e9b8e0d17ba3822))
* resolve git merge conflicts keeping HEAD ([01446f7](https://github.com/Josecanihuante/novanetsuiterp/commit/01446f7b5259f17c44c9281a206042fe858173e4))
* use axios client in UserManagementPage ([d0b2781](https://github.com/Josecanihuante/novanetsuiterp/commit/d0b2781b58a91012d52fe319cc475889b17af8d1))
* use List from typing for Python 3.9 compatibility ([a4e1ca5](https://github.com/Josecanihuante/novanetsuiterp/commit/a4e1ca52b29eb3dbbba112f7753fbe22bfa2de5e))
* Vercel proxy to bypass CORS permanently ([e1554e7](https://github.com/Josecanihuante/novanetsuiterp/commit/e1554e76e7bb0c61ba432e27335692ad12c6f339))
