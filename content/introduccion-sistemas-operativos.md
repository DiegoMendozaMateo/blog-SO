---
title: "Introducción a los Sistemas Operativos"
date: "2026-05-16"
excerpt: "Resumen y reflexiones personales sobre los temas del curso de Sistemas Operativos: procesos, hilos, IPC, memoria y más."
tags: ["sistemas-operativos", "linux"]
author: "Diego Mendoza Mateo"
---

## Prólogo

Este blog forma parte de un mini proyecto para el curso de Sistemas Operativos. El objetivo es registrar lo que aprendí en cada tema, explicarlo con mis propias palabras y reflexionar sobre su importancia. 

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

### Exploración del sistema en linux

> *Espacio para agregar capturas de pantalla y resultados de los comandos ejecutados.*

```bash
# Ejemplo: ver la versión del kernel
uname -a
```

![Resultado del comando uname -a](/post/introduccionSO/cap-dos.jpg)

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

#### codigos de practica de procesos hijos y padre
En esta seccion presentare 2 codigos sencillos donde se uusaron algunas de las llamadas anteriores.
- factorial de 2 numeros usando procesos padre e hijo:
```c
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/wait.h>


int main(int argc, char *argv[]){
	//variables(tuberias y numeros)
	int tub1[2];//tuberia de padre a hijo
	int tub2[2];//tuberia de hijo a padre
	int num1,num2;
	unsigned long long resp,resh;
	
	printf("factorial de 2 numeros(menores que 21 por que si no explota): ");
	scanf("%d %d",&num1,&num2);
	
	//creacion de las tuberias y comprobacion
	if (pipe(tub1) == -1 || pipe(tub2) == -1){
		printf("Error en la creacion de alguna tuberia");
		exit(-1);
		}
	
	//creacion del hijo
	pid_t hijo = fork();
	
	if (hijo == 0){
		//cerrar y abrir tuberias
		close(tub1[1]);//cerrar escritura [1]
		close(tub2[0]);//cerrar lectura [0]
		
		int n;
		unsigned long long r;
		read(tub1[0], &n, sizeof(int));//leer numero que envia el padre
		close(tub1[0]);
		
		//factorial
		
		r=1;
		for(int i=1;i <= n;i++){
			r *= i;
			}
		//mandar el resultado al padre
		write(tub2[1], &r, sizeof(unsigned long long));
		close(tub2[1]);
		
		exit(0);
		}
	else if(hijo == -1){
		printf("Error al crear el hijo");
		exit(-1);
		}
	
	if (hijo > 0){
		//cerrar y abrir tuberias
		close(tub1[0]);//cerrar lectura [0]
		close(tub2[1]);//cerrar escritura [1]
		
		write(tub1[1], &num2, sizeof(int));//mandar numero a hijo
		close(tub1[1]);
		
		//factorial
		resp = 1;
		for(int j=1;j <= num1;j++){
			resp *= j;
			}
		
		//respuesta del hijo
		read(tub2[0], &resh, sizeof(unsigned long long));
		close(tub2[0]);	
		
		wait(NULL);//esperar a que el hijo termine
		
		//imprimir resultados
		printf("Factorial de %d: %llu\n",num1,resp);
		printf("Factorial de %d: %llu\n",num2,resh);
		
		}
		
	printf("Programa terminado");	
	return EXIT_SUCCESS;
	}
```
resultado del programa:
![Resultado del comando uname -a](/post/introduccionSO/cap-tres.jpg)

- - Este codigo se podria mejorar usando `perror()` para imprimir errores, ya que en este caso, imprimo un error con `printf()` que no es lo mas optimo.
- - Otra mejora podria ser mejorar la estructura.

- crear un arbol:
```c
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/wait.h>

void CrearArbol(int nivelActual, int nivelMax){
    // impresión de los valores
    printf("PID del padre: %ld | PID del hijo: %ld | nivel: %d\n",
           (long)getppid(), (long)getpid(), nivelActual);

    // condición de salida
    if (nivelActual >= nivelMax){
        return;
    }

    // crear hijo izquierdo
    pid_t hijoIzq = fork();
    if (hijoIzq == 0){
        CrearArbol(nivelActual + 1, nivelMax);
        sleep(15);
        exit(0);
    } else if(hijoIzq == -1){
        perror("Error en la creación del hijo izquierdo");
        exit(EXIT_FAILURE);
    }

    // crear hijo derecho
    pid_t hijoDer = fork();
    if (hijoDer == 0){
        CrearArbol(nivelActual + 1, nivelMax);
        sleep(15);
        exit(0);
    } else if(hijoDer == -1){
        perror("Error en la creación del hijo derecho");
        exit(EXIT_FAILURE);
    }

    // esperar a los hijos
    wait(NULL);
    wait(NULL);

    sleep(15);
}

int main(int argc, char *argv[]) {
    if (argc != 2) {
        fprintf(stderr, "Uso: %s <numero_niveles>\n", argv[0]);
        return EXIT_FAILURE;
    }

    int nivel = atoi(argv[1]);
    if (nivel <= 0) {
        fprintf(stderr, "El número de niveles debe ser mayor que 0\n");
        return EXIT_FAILURE;
    }

    CrearArbol(0, nivel - 1);
    printf("Programa terminado\n");
    return EXIT_SUCCESS;
}

``` 

resultado del programa:
![Resultado del comando uname -a](/post/introduccionSO/cap-cuatro.jpg)

- - Investigando como podria mejorar este codigo encontre que se podria mejorar usando `fflush(stdout)` antes de cada `fork()` ya que `printf()` guarda el texto en un buffer interno. Si el buffer no se ha vaciado cuando se hace el `fork()`, el proceso hijo heredara una copia del buffer con el texto aún allí, y ambos procesos terminarán imprimiendo lo mismo, duplicando líneas en la consola y dando un árbol falso.
- - Usar un `sleep()` para que el padre espere antes de terminar, pero después de que los hijos hayan hecho su trabajo.
- - Otra mejora podria ser mejorar la estructura.

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

#### codigos de practica de hilos

En esta sección presentare un codigo de hilos muy simple para ejemplificar el funcionamiento de la creación de hilos.

- crea 2 hilos:
este codigo crea 2 hilos e imprime cual se creo primero, despues imprime un valor personalizado.

```c
#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>

void *funcionmensaje(void *ptr);

int main(void){
	pthread_t hilo1, hilo2;
	char *mensaje1= "hilo 1";
	char *mensaje2= "hilo 2";
	int uno,dos;
	
	uno= pthread_create(&hilo1, NULL, funcionmensaje, (void *)mensaje1);
	dos= pthread_create(&hilo2, NULL, funcionmensaje, (void *)mensaje2);
	
	pthread_join(hilo1,NULL);
	pthread_join(hilo2,NULL);
	
	printf("Hilo 1 retorna: %d\n",uno);
	printf("Hilo 2 retorna: %d\n",dos);
	
	return EXIT_SUCCESS;
}

void *funcionmensaje(void *ptr){
	char *mensaje;
	
	mensaje=(char *)ptr;
	printf("%s\n",mensaje);
	pthread_exit(0);
	
}

```

resultado del programa:
![Resultado del comando uname -a](/post/introduccionSO/cap-cinco.jpg)

![Resultado del comando uname -a](/post/introduccionSO/cap-seis.jpg)

En este caso a veces puede variar la creación de los hilos, por eso en las imagenes anteriores a veces se crea primero el hilo 1 y otras veces el hilo 2.

- Al ser un codigo muy pequeño de ejemplo para ver la funcionalidad de llamada, no creo que sea necesario buscar una manera de mejorarlo.

> Lo visto en esta sección fue lo mas interesante para mi a lo largo del semestre, ya que aprendí a crear y manipular hilos, procesos padre e hijo, de manera que mi codigo hiciera dos cosas de manera simultanea o concurrente y creo que eso es muy interesante a la hora de aprovechar los recursos de a mejor manera como programador, aunque hay que tener cuidado a la hora de usar las llamadas.


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

- - un buen ejemplo de este tipo de tuberia simple se encuntra en el codigo de factorial padre e hijo que se encuentra en el tema anterior.

### 3.1.2 Tuberías con nombre — `mkfifo()`

Las tuberías con nombre (FIFO) funcionan igual que las pipes, pero tienen un nombre en el sistema de archivos, lo que permite que **procesos no emparentados** se comuniquen.

```c
mkfifo("mi_tuberia", 0666);
```

Cualquier proceso puede abrir el FIFO con `open()` para leer o escribir.

#### codigos de practica de tuberias con nombre

En esta sección pondre un codigo de ejemplo de una tuberia con nombre que devuelve el ID del padre y del hijo.

```c
#include <stdio.h>
#include <stdlib.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
int main (void)
{
pid_t hijo;
int file;
char mensaje[20];
unlink("namepipe"); // borra el archivo del sistema de archivos
umask(~0666); // cambia la máscara de permisos por defecto
if(mkfifo("namepipe",0666)==-1)
{
perror("error en mkfifo");
exit(-1);
}
if ( (hijo=fork ( ))== 0)
{
fprintf (stdout,"soy el hijo, ID=%ld\n",(long)getpid());
if( (file=open("namepipe",O_WRONLY) ) ==-1)
{
perror("error en mkfifo");
exit(-1);
}
write (file,"soy el hijo,ID...\n",19);
close(file);
getchar();
exit(0);
}
if (hijo > 0)
{
fprintf (stdout,"soy el padre, ID = %ld\n",(long)getpid());
if((file=open("namepipe",O_RDONLY))==-1)
{
perror("error en open O_RDONLY");
exit(-1);
}
read(file,mensaje,20);
fprintf(stdout,"%s\n",mensaje );
close(file);
}
return EXIT_SUCCESS;
}

```
resultado del programa:
![Resultado del comando uname -a](/post/introduccionSO/cap-siete.jpg)

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

#### codigo de practica de semaforo
En esta sección presentare un codigo usando semaforos. En este caso es un codigo simple que hace que el proceso padre le encie una señal al proceso hijo y este resppnda.

```c
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/ipc.h>
#include <sys/sem.h>
#include <sys/wait.h>

/* Estructura necesaria para semctl */
union semun {
    int val;
};

int main(int argc, char *argv[]) {

    key_t llave;
    int semid;
    pid_t pid;
    struct sembuf op;
    union semun arg;

    /* Generar clave IPC */
    llave = ftok(argv[0], 65);

    /* Crear semáforo */
    semid = semget(llave, 1, 0666 | IPC_CREAT);
	/*066 ->lectura y escritura */
    /* Inicializar semáforo en 0 */
    arg.val = 0;
    semctl(semid, 0, SETVAL, arg);

    pid = fork();

    if(pid == 0) {

        /* PROCESO HIJO */

        printf("Hijo: esperando señal del padre...\n");

        op.sem_num = 0;
        op.sem_op = -1;  // operación P (wait)
        op.sem_flg = 0;

        semop(semid, &op, 1);

        printf("Hijo: señal recibida, continuando ejecución.\n");

    } else {

        /* PROCESO PADRE */

        sleep(2);
        printf("Padre: enviando señal al hijo...\n");

        op.sem_num = 0;
        op.sem_op = 1;   // operación V (signal)
        op.sem_flg = 0;

        semop(semid, &op, 1);

        wait(NULL);

        /* Eliminar semáforo */
        semctl(semid, 0, IPC_RMID);

        printf("Padre: proceso terminado.\n");
    }

    return EXIT_SUCCESS;
}

```
resultado del programa:
![Resultado del comando uname -a](/post/introduccionSO/cap-ocho.jpg)

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

#### codigo de practica de cola de mensajes
En esat sección presentare un codigo que simula el comando who de linux usando la cola de mensajes. Este codigo fue dado en clase para ejemplificar el uso de la lllamda.

```c

// ejercicio2 - cola de mensajes con who (utmp + ctime)
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <time.h>
#include <utmp.h>          // struct utmp, setutent, getutent
#include <sys/types.h>
#include <sys/ipc.h>       // ftok, IPC_CREAT
#include <sys/msg.h>       // msgget, msgsnd, msgrcv, msgctl
#include <sys/wait.h>

// ── Estructura del mensaje ──────────────────────────────────────────────
// La cola de mensajes de System V requiere que el primer campo sea
// siempre un long llamado mtype (es obligatorio por la API).
// El resto es el contenido que queremos mandar.
#define TIPO_USUARIO  1L   // mensaje con datos de un usuario
#define TIPO_FIN      2L   // señal de que ya no hay mas datos

typedef struct {
    long mtype;            // tipo del mensaje (obligatorio, debe ser > 0)
    char usuario[32];      // nombre de usuario
    char terminal[32];     // tty o pts donde esta conectado
    char hora[64];         // tiempo de login formateado con ctime()
} Mensaje;

// ── EMISOR: lee utmp y manda un mensaje por cada usuario activo ─────────
void emisor(int mqid) {
    struct utmp *entrada;
    Mensaje msg;
    int enviados = 0;

    // setutent() rebobina el archivo /var/run/utmp al inicio
    setutent();

    // getutent() lee una entrada a la vez, retorna NULL al terminar
    while ((entrada = getutent()) != NULL) {

        // ut_type == USER_PROCESS significa que es una sesion de usuario real
        // (filtra entradas de boot, runlevel, etc.)
        if (entrada->ut_type != USER_PROCESS)
            continue;

        msg.mtype = TIPO_USUARIO;

        // Copiar usuario y terminal con strncpy para evitar overflow
        strncpy(msg.usuario,  entrada->ut_user, sizeof(msg.usuario)  - 1);
        strncpy(msg.terminal, entrada->ut_line, sizeof(msg.terminal) - 1);
        msg.usuario[sizeof(msg.usuario)   - 1] = '\0';
        msg.terminal[sizeof(msg.terminal) - 1] = '\0';

        // ut_tv.tv_sec es el timestamp del login — ctime() lo convierte
        // a string "Www Mmm dd hh:mm:ss yyyy\n", quitamos el \n final
        time_t t = (time_t)entrada->ut_tv.tv_sec;
        char *ct = ctime(&t);
        strncpy(msg.hora, ct, sizeof(msg.hora) - 1);
        msg.hora[sizeof(msg.hora) - 1] = '\0';
        // quitar el salto de linea que pone ctime
        msg.hora[strcspn(msg.hora, "\n")] = '\0';

        // msgsnd(id_cola, &mensaje, tamaño_del_contenido, flags)
        // El tamaño NO incluye el campo mtype, solo el contenido
        if (msgsnd(mqid, &msg, sizeof(Mensaje) - sizeof(long), 0) == -1) {
            perror("msgsnd usuario");
            exit(EXIT_FAILURE);
        }
        enviados++;
        printf("[Emisor]  enviado: %-12s  %-12s  %s\n",
               msg.usuario, msg.terminal, msg.hora);
    }

    endutent(); // cerrar /var/run/utmp

    // Mandar mensaje de fin para que el receptor sepa que ya no hay mas
    memset(&msg, 0, sizeof(Mensaje));
    msg.mtype = TIPO_FIN;
    if (msgsnd(mqid, &msg, sizeof(Mensaje) - sizeof(long), 0) == -1) {
        perror("msgsnd fin");
        exit(EXIT_FAILURE);
    }

    printf("[Emisor]  total enviados: %d  (+1 mensaje de fin)\n\n", enviados);
    exit(EXIT_SUCCESS);
}

// ── RECEPTOR: recibe mensajes e imprime como who ────────────────────────
void receptor(int mqid) {
    Mensaje msg;
    int recibidos = 0;

    printf("\n%-12s  %-12s  %s\n", "USUARIO", "TERMINAL", "HORA LOGIN");
    printf("%-12s  %-12s  %s\n",
           "------------", "------------",
           "-------------------------------");

    // Recibir mensajes de TIPO_USUARIO hasta encontrar TIPO_FIN
    while (1) {
        // msgrcv(id_cola, &buffer, tamaño_contenido, tipo, flags)
        // tipo=0 recibe cualquier mensaje; tipo=N recibe solo ese tipo
        // Aqui recibimos cualquiera para manejar ambos tipos
        if (msgrcv(mqid, &msg, sizeof(Mensaje) - sizeof(long), 0, 0) == -1) {
            perror("msgrcv");
            exit(EXIT_FAILURE);
        }

        if (msg.mtype == TIPO_FIN)
            break;

        printf("%-12s  %-12s  %s\n", msg.usuario, msg.terminal, msg.hora);
        recibidos++;
    }

    printf("\nTotal de usuarios conectados: %d\n\n", recibidos);

    // msgctl(id, IPC_RMID, NULL) elimina la cola del kernel
    // Si no se hace, la cola persiste aunque el programa termine
    // (se puede ver con: ipcs -q)
    if (msgctl(mqid, IPC_RMID, NULL) == -1)
        perror("msgctl IPC_RMID");
    else
        printf("[Receptor] Cola de mensajes eliminada.\n");

    exit(EXIT_SUCCESS);
}

// ── MAIN ────────────────────────────────────────────────────────────────
int main(void) {
    // ftok genera una clave IPC a partir de un archivo existente y un id
    // Todos los procesos que usen el mismo archivo+id obtienen la misma clave
    key_t clave = ftok("/tmp", 'W');
    if (clave == -1) {
        perror("ftok");
        exit(EXIT_FAILURE);
    }

    // msgget crea la cola si no existe (IPC_CREAT) o la abre si ya existe
    // 0666 son los permisos de acceso (lectura/escritura para todos)
    int mqid = msgget(clave, IPC_CREAT | 0666);
    if (mqid == -1) {
        perror("msgget");
        exit(EXIT_FAILURE);
    }

    printf("=== Cola de mensajes (who) ===\n");
    printf("ID de cola: %d  (verificar con: ipcs -q)\n\n", mqid);

    switch (fork()) {

    case -1:
        perror("fork");
        msgctl(mqid, IPC_RMID, NULL); // limpiar si falla el fork
        exit(EXIT_FAILURE);

    case 0:   // HIJO = Receptor
        receptor(mqid);
        break;

    default:  // PADRE = Emisor
        emisor(mqid);
        wait(NULL);
        break;
    }

    return EXIT_SUCCESS;
}

```
- la unica manera de mejorar en el uso de tuberias y semaforos, al menos desde mi punto de vista es poner muchos comentarios a tus codigos, especificar para que es y cual es su funcion, los datos que maneja,etc. para que cualquier error a la hora de manipularlos sea facil identificar donde podria encontrase el error.

resultado del programa:
![Resultado del comando uname -a](/post/introduccionSO/cap-nueve.jpg)


> Los temas presentados tambien fueron de un gran interes para mi, ya que estos llamados son importantes para manejar la informacion de manera mas optima y eficiente pero creo que estas tiene una dificultad bastante alta a la hora de trabajar con ellas ya que cualquier error puede ocasionar que no manejes bien la información del programa y termines con un codigo que no compila. Estos temas me enseñaron a ser cuidadoso a la hora de manejar cosas que parecen simples y no lo son. 

---

## 4. Administración de Memoria

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

#### codigo
En esta sección presentare un fragmento de codigo, en especifíco una función que simula el comando free() de linux.

```c
void fre() {
    struct sysinfo info;
    if (sysinfo(&info) == -1) {
        perror("sysinfo");
        return;
    }
    
    unsigned long unit = 1024;// Definimos la unidad de conversión (KB)
    unsigned long m = info.mem_unit;// Multiplicador para convertir a bytes antes de convertir a KB

    printf(" Estructura sysinfo \n");

    //tiempos y carga de trabajo
    printf("Uptime:             %ld segundos\n", info.uptime);
    printf("Load Average:  %.2f%%\n", info.loads[0] / 65536.0);
    printf("Load Average:  %.2f%%\n", info.loads[1] / 65536.0);
    printf("Load Average: %.2f%%\n", info.loads[2] / 65536.0);
    
    printf("\n%-15s %12s %12s %12s\n", "Categoría", "Total ", "Usado ", "Libre ");
    printf("\n");

    // memoria
    printf("%-15s %12lu %12lu %12lu\n", "Memoria RAM:",
           (info.totalram * m) / unit,
           ((info.totalram - info.freeram) * m) / unit,
           (info.freeram * m) / unit);

    //swap
    printf("%-15s %12lu %12lu %12lu\n", "Swap:",
           (info.totalswap * m) / unit,
           ((info.totalswap - info.freeswap) * m) / unit,
           (info.freeswap * m) / unit);

    // otros detalles de memoria
    printf("\nDetalles adicionales:\n");
    printf("Memoria compartida: %12lu KB\n", (info.sharedram * m) / unit);
    printf("Memoria en buffers: %12lu KB\n", (info.bufferram * m) / unit);
    printf("Memoria High (Total): %12lu KB\n", (info.totalhigh * m) / unit);
    printf("Memoria High (Libre): %12lu KB\n", (info.freehigh * m) / unit);
    
    // estadísticas de procesos y hardware
    printf("\n%-20s %u\n", "Procesos actuales:", info.procs);
    printf("%-20s %u bytes\n", "Tamaño de unidad:", info.mem_unit);
    printf("\n");
}
```

resultado del programa:
![Resultado del comando uname -a](/post/introduccionSO/cap-diez.jpg)

- - Este codigo podria mejorarse usando unsigned long long en tipo de datos para evitar el desbordamiento de datos.

> Siendo sincero este tema no me gusto tanto, es un tema interesante pero muy complicado, despues de todo creo que a la mayoria de programadores les cuesta manejar memoria.

---

## 5. Arquitectura del Sistema de Archivos

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

---

## 6. Señales

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

