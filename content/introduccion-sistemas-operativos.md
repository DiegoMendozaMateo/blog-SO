---
title: "Portafolio de Sistemas Operativos"
date: "2025-05-15"
excerpt: "Resumen y reflexiones personales sobre los temas del curso de Sistemas Operativos: procesos, hilos, IPC, memoria y más."
tags: ["sistemas-operativos", "linux", "portafolio"]
author: "Tu Nombre"
---

## Prólogo

Estas notas forman parte de mi portafolio para el curso de Sistemas Operativos. El objetivo es registrar lo que aprendí en cada tema, explicarlo con mis propias palabras y reflexionar sobre su importancia. El material se basa en las notas *Un vistazo a los Sistemas Operativos* del M.C. Gabriel Gerónimo C. de la Universidad Tecnológica de la Mixteca.

---

## 1. Introducción al Sistema Operativo Linux

Un sistema operativo (SO) es el software que hace de puente entre el usuario y el hardware. Sin él, la computadora sería un conjunto de circuitos sin sentido. Sus responsabilidades principales son administrar procesos, memoria, archivos, dispositivos y seguridad.

Linux es un SO de propósito general basado en el núcleo (kernel) de GNU/Linux. Es multitarea, multiusuario y de código abierto, lo que lo hace ideal para aprender cómo funciona un SO por dentro, ya que se puede inspeccionar y modificar su comportamiento.

Los sistemas operativos pueden clasificarse según su uso:

- **Por lotes**: procesan trabajos agrupados sin intervención del usuario (ej. sistemas bancarios antiguos).
- **Tiempo real**: garantizan respuestas dentro de plazos estrictos (ej. control de tráfico aéreo).
- **Multitarea**: ejecutan varios procesos de forma concurrente (ej. Linux, Windows, macOS).
- **Distribuidos**: distribuyen la carga entre varios equipos interconectados.
- **Paralelos**: aprovechan múltiples núcleos o procesadores al mismo tiempo.
- **Móviles**: optimizados para recursos limitados (ej. Android, iOS).

### Práctica 1 — Exploración del sistema

> *Espacio para agregar capturas de pantalla y resultados de los comandos ejecutados.*

```bash
# Ejemplo: ver la versión del kernel
uname -r

# Ver procesos activos
ps aux
```

---

## 2. Procesos e Hilos

### 2.1 Introducción a procesos

Un **proceso** es un programa en ejecución. Cada proceso tiene su propio espacio de memoria, identificador único (PID) y estado. Los estados posibles de un proceso son:

- **Nuevo**: recién creado, aún no admitido por el SO.
- **Listo**: espera que la CPU lo atienda.
- **En ejecución**: la CPU está ejecutando sus instrucciones.
- **Bloqueado**: espera un evento externo (por ejemplo, una lectura de disco).
- **Terminado**: finalizó su ejecución.

En GNU/Linux, el kernel representa cada proceso con una estructura llamada `task_struct`. Los estados internos incluyen `TASK_RUNNING`, `TASK_INTERRUPTIBLE`, `TASK_STOPPED`, entre otros.

### 2.2 Sistema de llamada para crear procesos — `fork()`

La función `fork()` crea un nuevo proceso (hijo) que es una copia casi exacta del proceso que la invoca (padre). Después del `fork()`, ambos procesos continúan ejecutándose desde la línea siguiente, pero con valores de retorno distintos:

- En el **hijo** → devuelve `0`.
- En el **padre** → devuelve el PID del hijo.
- En caso de **error** → devuelve `-1`.

```c
#include <sys/types.h>
#include <unistd.h>

pid_t pid = fork();

if (pid == 0) {
    // Código del hijo
} else if (pid > 0) {
    // Código del padre
} else {
    // Error
}
```

El hijo hereda el entorno, descriptores de archivo y privilegios del padre, pero recibe su propio PID y sus tiempos de CPU se reinician a cero.

### 2.4 Sistema de llamada para identificar procesos — `getpid()` y `getppid()`

Cada proceso puede conocer su propio PID y el PID de su padre:

```c
pid_t getpid(void);   // Devuelve el PID del proceso actual
pid_t getppid(void);  // Devuelve el PID del proceso padre
```

Si el padre termina antes que el hijo, el hijo queda **huérfano** y es adoptado automáticamente por el proceso 1 (`init` o `systemd`).

### 2.5 Sistema de llamada `wait()`

Después de crear un hijo con `fork()`, el padre puede usar `wait()` para esperarlo y recoger su estado de terminación:

```c
#include <sys/wait.h>
pid_t wait(int *stat_loc);
```

Si el padre **no llama a `wait()`** y el hijo termina, el hijo queda en estado **zombi**: ya no consume CPU ni memoria, pero sigue ocupando una entrada en la tabla de procesos hasta que el padre recoja su estado.

Para esperar a un hijo específico, se usa `waitpid()`, que además permite opciones como `WNOHANG` (no bloquear si ningún hijo ha terminado).

### 2.6 Sistema de llamada `_exit()` y `exit()`

- `_exit(status)`: termina el proceso inmediatamente sin limpiar recursos.
- `exit(status)`: limpia buffers, llama funciones registradas con `atexit()`, y después invoca `_exit()`. Es la forma recomendada de terminar un proceso.

Por convención, `status = 0` indica éxito y cualquier valor distinto de cero indica error.

### 2.7 Estado Zombi

Un proceso zombi es aquel que ya terminó pero cuyo padre aún no ha llamado a `wait()`. El zombi no hace nada, pero ocupa una entrada en la tabla de procesos. Para evitarlos, el padre siempre debe llamar a `wait()` o `waitpid()` después de crear hijos.

Para observar zombis en el sistema:
```bash
ps -el | grep Z
```

### 2.8 Hilos

Un **hilo** (thread) es una unidad de ejecución dentro de un proceso. A diferencia de los procesos, los hilos de un mismo proceso **comparten memoria y recursos**, lo que los hace más ligeros y eficientes para tareas concurrentes.

Se usan cuando se necesita:
- Ejecutar varias tareas al mismo tiempo dentro de una misma aplicación.
- Compartir datos sin mecanismos costosos de comunicación.
- Aprovechar procesadores con múltiples núcleos.

### 2.8.2 Creación de hilos — `pthread_create()`

En C se usa la biblioteca POSIX Threads (`pthreads`):

```c
#include <pthread.h>

int pthread_create(
    pthread_t *thread,           // ID del nuevo hilo
    const pthread_attr_t *attr,  // Atributos (NULL = predeterminados)
    void* (*start_routine)(void *), // Función que ejecutará el hilo
    void *arg                    // Argumento para la función
);
```

Para esperar que un hilo termine (equivalente a `wait()` para procesos):

```c
pthread_join(tid, NULL);
```

Para compilar programas con hilos:
```bash
gcc programa.c -o programa -lpthread
```

### Práctica 2 — Procesos e hilos

> *Espacio para agregar capturas de pantalla y resultados de los programas ejecutados.*

---

## 3. Mecanismos de Comunicación entre Procesos (IPC)

Los procesos necesitan comunicarse entre sí para intercambiar datos. El sistema operativo ofrece varios mecanismos para esto.

### 3.1 Tuberías sin nombre — `pipe()`

Una tubería (pipe) es el mecanismo más básico de comunicación entre procesos emparentados. Los datos fluyen **en una sola dirección** (del escritor al lector) y solo funcionan entre procesos que comparten un ancestro común.

```c
int fd[2];
pipe(fd);
// fd[0] → extremo de lectura
// fd[1] → extremo de escritura
```

Después de un `fork()`, padre e hijo pueden usar la tubería para enviarse mensajes.

### 3.1.2 Tuberías con nombre — `mkfifo()`

Las tuberías con nombre (FIFO) funcionan igual que las pipes, pero tienen un nombre en el sistema de archivos, lo que permite que **procesos no emparentados** se comuniquen.

```c
mkfifo("mi_tuberia", 0666);
```

Cualquier proceso puede abrir el FIFO con `open()` para leer o escribir.

### 3.2 Mecanismos IPC de System V

Son tres mecanismos implementados en el kernel que comparten la misma interfaz basada en **llaves** (`key_t`) para identificar los recursos:

| Mecanismo | Función principal |
|---|---|
| Semáforos | Sincronizar el acceso a recursos compartidos |
| Memoria compartida | Compartir una zona de memoria entre procesos |
| Colas de mensajes | Intercambiar mensajes estructurados |

La llave se genera con `ftok()`:
```c
key_t llave = ftok("/ruta/archivo", 'a');
```

### 3.2.2 Semáforos (System V)

Los semáforos son contadores enteros no negativos usados para sincronizar procesos. Las operaciones principales son:

- `semget()` → Crear o acceder a un conjunto de semáforos.
- `semop()` → Incrementar o decrementar el valor del semáforo (bloquear/desbloquear).
- `semctl()` → Inicializar, consultar o eliminar el semáforo.

Un semáforo con valor `1` significa recurso libre; con valor `0`, recurso ocupado.

### 3.2.3 Semáforos POSIX

Una alternativa más moderna y sencilla que los semáforos System V:

```c
sem_t semaforo;
sem_init(&semaforo, 0, 1); // Valor inicial: 1 (libre)
sem_wait(&semaforo);       // Decrementar (bloquear)
sem_post(&semaforo);       // Incrementar (desbloquear)
```

Para sincronizar hilos también se puede usar **mutex**:

```c
pthread_mutex_t mutex;
pthread_mutex_lock(&mutex);    // Entra a sección crítica
// ... código protegido ...
pthread_mutex_unlock(&mutex);  // Sale de sección crítica
```

### 3.3 Memoria compartida

Es la forma más rápida de comunicación entre procesos. Dos o más procesos comparten una zona de memoria directamente.

```c
int shmid = shmget(llave, tamaño, IPC_CREAT | 0600);
void *ptr = shmat(shmid, NULL, 0); // Unirse al segmento
// ... usar ptr como memoria normal ...
shmdt(ptr);                        // Desconectarse
shmctl(shmid, IPC_RMID, 0);        // Eliminar el segmento
```

### 3.4 Cola de mensajes

Permite enviar y recibir mensajes estructurados entre procesos. Cada mensaje tiene un tipo (`mtype`) y un cuerpo (`mtext`).

```c
int qid = msgget(llave, IPC_CREAT | 0666);
msgsnd(qid, &mensaje, tamaño, 0);         // Enviar
msgrcv(qid, &mensaje, tamaño, tipo, 0);   // Recibir
```

### 3.5 Ver objetos IPC con comandos

```bash
ipcs          # Lista todos los objetos IPC activos
ipcs -m       # Solo memoria compartida
ipcs -s       # Solo semáforos
ipcs -q       # Solo colas de mensajes
```

Los objetos IPC también están visibles en `/proc/sysvipc/`.

### Práctica 3 — Comunicación entre procesos

> *Espacio para agregar capturas de pantalla y resultados de los programas ejecutados.*

---

## 5. Administración de Memoria

### Introducción

La memoria principal (RAM) es limitada. El SO se encarga de distribuirla eficientemente entre todos los procesos activos, manteniendo en ella a los más prioritarios y usando el disco como extensión cuando es necesario.

Las dos herramientas fundamentales son:
- **Paginación**: divide la memoria en páginas de tamaño fijo.
- **Segmentación**: divide en segmentos de tamaño variable.

### Multiprogramación

Tener varios procesos en memoria al mismo tiempo mejora el uso de la CPU. Si un proceso se bloquea esperando E/S, la CPU puede ejecutar otro. La fórmula para estimar el uso de CPU con `n` procesos es:

```
Uso de CPU = 1 - p^n
```

donde `p` es la fracción de tiempo que un proceso pasa esperando E/S.

### Particiones y algoritmos de asignación

Cuando hay varios procesos esperando memoria, el SO necesita decidir a quién asignarla. Los algoritmos principales son:

- **Primero en ajustarse**: busca el primer hueco suficientemente grande. Es rápido.
- **Siguiente en ajustarse**: igual, pero empieza a buscar desde donde se quedó la última vez.
- **Mejor ajuste**: busca el hueco más pequeño que sea suficiente. Minimiza el desperdicio.
- **Peor ajuste**: asigna el hueco más grande disponible.

### Intercambio (Swap)

Cuando la RAM se llena, el SO mueve procesos menos prioritarios al disco. En Linux, esto se llama **swap**.

```bash
swapon   # Ver el área de swap activa
free -h  # Ver uso de RAM y swap
```

### Memoria Virtual

Permite que un programa use más memoria de la que físicamente existe. El SO mantiene en RAM solo las partes del programa que se usan en el momento; el resto vive en disco. La unidad de transferencia se llama **página**.

La **MMU** (Unidad de Administración de Memoria) traduce las direcciones virtuales que usa el programa a direcciones físicas reales.

### Práctica 5 — Administración de memoria

> *Espacio para agregar capturas de pantalla y resultados de los comandos ejecutados.*

---

## 6. Arquitectura del Sistema de Archivos

### Introducción

En UNIX/Linux, el sistema de archivos tiene una estructura jerárquica formada por cuatro partes:

```
Boot | Superbloque | Lista de inodos | Bloques de datos
```

- **Boot**: código de arranque del SO.
- **Superbloque**: describe el estado general del sistema de archivos (tamaño, inodos libres, bloques libres, etc.).
- **Inodos**: cada archivo tiene uno. Contiene metadatos: propietario, permisos, tamaño, dónde están los datos en disco.
- **Bloques de datos**: el contenido real de los archivos.

### Inodos

Un inodo **no contiene el nombre del archivo**; ese nombre vive en el directorio. El inodo guarda:

- Propietario y grupo.
- Permisos de acceso.
- Tipo de archivo.
- Tamaño.
- Fechas de acceso, modificación y cambio.
- Direcciones de los bloques donde están los datos.

Para ver los metadatos de un archivo desde C se usa `stat()`:

```c
struct stat sb;
stat("archivo.txt", &sb);
printf("Tamaño: %lld bytes\n", (long long)sb.st_size);
```

### Tipos de archivos en UNIX

| Tipo | Descripción |
|---|---|
| Regular | Archivos de datos normales |
| Directorio | Mapea nombres de archivos a inodos |
| Dispositivo de bloque | Discos, memorias USB |
| Dispositivo de carácter | Terminales, teclados, impresoras |
| FIFO/pipe | Archivos de comunicación |
| Socket | Comunicación en red |

Para navegar directorios desde C:

```c
DIR *dir = opendir("/ruta");
struct dirent *entrada;
while ((entrada = readdir(dir)) != NULL) {
    printf("%s\n", entrada->d_name);
}
closedir(dir);
```

### Comandos útiles del sistema de archivos

```bash
df -h       # Uso de espacio en disco por partición
du -sh *    # Tamaño de carpetas en el directorio actual
lsblk       # Lista de dispositivos de bloque
fsck        # Verificar y reparar el sistema de archivos
```

### Práctica 6 — Sistema de archivos

> *Espacio para agregar capturas de pantalla y resultados de los programas ejecutados.*

---

## 7. Señales

### Introducción

Una **señal** es una interrupción de software que el SO envía a un proceso para notificarle de un evento. Piensa en ellas como mensajes asíncronos: pueden llegar en cualquier momento, sin importar lo que el proceso esté haciendo.

Cuando un proceso recibe una señal puede:
1. **Ignorarla** (si está configurado para ello).
2. **Ejecutar la acción por defecto** (generalmente terminar el proceso).
3. **Ejecutar su propio manejador** (una función definida por el programador).

### Señales comunes en Linux

| Señal | Número | Causa |
|---|---|---|
| `SIGINT` | 2 | `Ctrl+C` en la terminal |
| `SIGKILL` | 9 | Termina el proceso incondicionalmente |
| `SIGTERM` | 15 | Solicita terminar (puede ignorarse) |
| `SIGSEGV` | 11 | Acceso a memoria inválida |
| `SIGCHLD` | 17 | Un proceso hijo terminó |
| `SIGALRM` | 14 | El temporizador expiró |

### Enviar señales

Desde la terminal:
```bash
kill -2 1234    # Envía SIGINT al proceso con PID 1234
kill -9 1234    # Fuerza la terminación
```

Desde C:
```c
#include <signal.h>
kill(pid, SIGTERM);   // Enviar señal a otro proceso
raise(SIGALRM);       // Enviarse una señal a sí mismo
```

### Manejar señales

Para capturar una señal y ejecutar código propio se usa `signal()`:

```c
void mi_manejador(int sig) {
    printf("Recibí la señal %d\n", sig);
}

signal(SIGINT, mi_manejador); // Captura Ctrl+C
```

### Función `alarm()`

Permite programar una señal `SIGALRM` después de un número de segundos:

```c
alarm(5); // En 5 segundos, el proceso recibirá SIGALRM
```

Útil para implementar timeouts.

### Práctica 7 — Señales

> *Espacio para agregar capturas de pantalla y resultados de los programas ejecutados.*

---

## Referencias

- Gerónimo C., Gabriel. *Un vistazo a los Sistemas Operativos*. Universidad Tecnológica de la Mixteca, Versión 2.0, 2026.
- Tanenbaum, A. S. *Sistemas Operativos Modernos*. Pearson, 3ª ed., 2008.
- Stallings, W. *Operating Systems: Internals and Design Principles*. Pearson, 7ª ed., 2012.
- Stevens, W. R. & Rago, S. A. *Advanced Programming in the UNIX Environment*. Addison-Wesley, 3ª ed., 2013.
