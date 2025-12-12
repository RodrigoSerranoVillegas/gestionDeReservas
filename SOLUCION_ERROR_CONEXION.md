# Solución al Error de Conexión a MySQL (ETIMEDOUT)

## 🔍 Diagnóstico

El error `ETIMEDOUT` significa que la aplicación no puede conectarse a MySQL. Esto puede deberse a varias causas.

## ✅ Soluciones Paso a Paso

### 1. Verificar que MySQL esté corriendo

**En Windows:**
- Si usas **XAMPP**: Abre el Panel de Control de XAMPP y asegúrate de que MySQL esté "Running" (verde)
- Si usas **WAMP**: Verifica que el icono de WAMP esté verde en la bandeja del sistema
- Si usas **MySQL como servicio**: 
  - Presiona `Win + R`, escribe `services.msc` y presiona Enter
  - Busca "MySQL" en la lista
  - Si está detenido, haz clic derecho → Iniciar

**En Linux/Mac:**
```bash
# Verificar si MySQL está corriendo
sudo systemctl status mysql
# O
sudo service mysql status

# Si no está corriendo, iniciarlo:
sudo systemctl start mysql
# O
sudo service mysql start
```

### 2. Verificar el archivo `.env`

Asegúrate de tener un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña_aqui
DB_NAME=gestionDeReservas
PORT=3000
SESSION_SECRET=tu-secreto-super-seguro-aqui
```

**Importante:**
- Si MySQL no tiene contraseña, deja `DB_PASSWORD=` vacío
- Si usas un puerto diferente a 3306, especifícalo en `DB_PORT`
- Si MySQL está en otro servidor, cambia `DB_HOST` a la IP o dominio

### 3. Verificar que la base de datos existe

Abre phpMyAdmin o tu cliente MySQL y verifica:

1. Que la base de datos `gestionDeReservas` existe
2. Si no existe, importa el archivo `gestionDeReservas.sql` que está en la raíz del proyecto

**En phpMyAdmin:**
- Selecciona la base de datos `gestionDeReservas` (o créala si no existe)
- Ve a la pestaña "Importar"
- Selecciona el archivo `gestionDeReservas.sql`
- Haz clic en "Continuar"

### 4. Verificar el puerto de MySQL

Por defecto, MySQL usa el puerto **3306**. Para verificar:

**En Windows (XAMPP):**
- El puerto se muestra en el Panel de Control de XAMPP junto a MySQL

**En la línea de comandos:**
```bash
# Windows
netstat -an | findstr 3306

# Linux/Mac
netstat -an | grep 3306
```

Si MySQL está usando otro puerto, actualiza `DB_PORT` en tu archivo `.env`.

### 5. Verificar credenciales

Prueba conectarte manualmente a MySQL:

**En la línea de comandos:**
```bash
# Windows (si MySQL está en el PATH)
mysql -u root -p

# O desde XAMPP
C:\xampp\mysql\bin\mysql.exe -u root -p
```

Si puedes conectarte manualmente pero la app no, el problema está en las credenciales del archivo `.env`.

### 6. Verificar firewall

A veces el firewall de Windows bloquea la conexión. Prueba:

1. Desactiva temporalmente el firewall de Windows
2. Si funciona, agrega una excepción para MySQL (puerto 3306)

### 7. Verificar que el puerto 3306 no esté bloqueado

Si usas un antivirus o firewall de terceros, verifica que el puerto 3306 esté permitido.

## 🧪 Probar la Conexión

Después de hacer los cambios, reinicia el servidor:

```bash
npm run dev
```

Deberías ver:
```
✅ Conexión a la base de datos establecida correctamente
```

## 📝 Configuración Típica por Entorno

### XAMPP (Windows)
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=gestionDeReservas
```

### WAMP (Windows)
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=gestionDeReservas
```

### MySQL Standalone (con contraseña)
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=gestionDeReservas
```

### MySQL Remoto
```env
DB_HOST=192.168.1.100
DB_PORT=3306
DB_USER=usuario_remoto
DB_PASSWORD=contraseña_remota
DB_NAME=gestionDeReservas
```

## 🆘 Si Nada Funciona

1. **Revisa los logs de MySQL** para ver si hay errores
2. **Reinstala MySQL** si es necesario
3. **Verifica que no haya otro servicio usando el puerto 3306**
4. **Prueba con otro cliente MySQL** (como MySQL Workbench) para verificar que la conexión funciona

## 📞 Información Útil para Depuración

Cuando ejecutes la aplicación, ahora verás información detallada sobre:
- Host configurado
- Puerto configurado
- Base de datos
- Usuario

Esto te ayudará a identificar qué está mal configurado.
