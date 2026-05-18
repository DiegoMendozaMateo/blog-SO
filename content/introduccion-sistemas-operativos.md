---
title: "Introducción a los Sistemas Operativos"
date: "2026-05-15"
excerpt: "Resumen y reflexiones personales sobre los temas del curso de Sistemas Operativos: procesos, hilos, IPC, memoria y más."
tags: ["sistemas-operativos", "linux"]
author: "Diego Mendoza Mateo"
---

## Prólogo

Este blog forma parte de un miniproyecto para el curso de Sistemas Operativos. El objetivo es registrar lo que aprendí en cada tema, explicarlo con mis propias palabras y reflexionar sobre su importancia. 

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
![Resultado ](/post/introduccionSO/cap-tres.jpg)

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
![Resultado ](/post/introduccionSO/cap-cuatro.jpg)

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
![Resultado ](/post/introduccionSO/cap-cinco.jpg)

![Resultado ](/post/introduccionSO/cap-seis.jpg)

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
![Resultado ](/post/introduccionSO/cap-siete.jpg)

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
![Resultado ](/post/introduccionSO/cap-ocho.jpg)

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
En esta sección presentare un codigo que simula el comando who de linux usando la cola de mensajes. Este codigo fue dado en clase para ejemplificar el uso de la lllamda.

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
![Resultado ](/post/introduccionSO/cap-nueve.jpg)


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
![Resultado](/post/introduccionSO/cap-diez.jpg)

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

#### codigo de practica

Para estos temas hicimos un miniproyecto llamado minishell,en el que buscabamos programar el comportamiento del shell nosotros mismos.

minishell:
```c
#define _XOPEN_SOURCE 500
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <dirent.h>
#include <errno.h>
#include <unistd.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <fcntl.h>
#include <stdint.h>
#include <sys/sysmacros.h>
#include <sys/utsname.h>

#include <time.h>
#include <utmp.h>
#include <sys/sysinfo.h>
#include <sys/ioctl.h>
#include <arpa/inet.h>
#include <sys/socket.h>
#include <linux/if.h>
#include <linux/sockios.h>


#define MAX_LEN 100


void pwd();
void cd(char *opcion);
void mkdr(char *opcion);
void ls(char *opcion);
void cat(char *opcion);
void unlnk(char *opcion);
void rname(char *opcion);
void find(char *opcion);
void estat(char *opcion);
void unme();
void date();
void who();
void fre();
void ip();
void mac();
void numerosdisp();

int main(int argc, char *argv[]){
    char opcion[MAX_LEN];

    while (1) {
        printf("\n> "); 
        if (fgets(opcion, MAX_LEN, stdin) == NULL){ 
			break;}

        opcion[strcspn(opcion, "\n")] = 0;//strcspn busca el \n y lo cambia por 0

        if (strcmp(opcion, "pwd") == 0) {
            pwd();
        } 
        else if (strcmp(opcion, "exit") == 0 || strcmp(opcion, "EXIT") == 0) {
            printf("Saliendo\n");
            exit(0);
        } 
        else if (strncmp(opcion, "cd", 2) == 0) {
            cd(opcion);
            }
        else if (strncmp(opcion, "mkdir", 5) == 0) {
            mkdr(opcion);
            }
        else if (strncmp(opcion,"ls", 2) == 0){
			ls(opcion);
			}
		else if (strncmp(opcion, "cat", 3) == 0){
			cat(opcion);
			}
		else if (strncmp(opcion, "unlink", 6) == 0){
			unlnk(opcion);
			}
		else if (strncmp(opcion, "rename", 6) == 0){
			rname(opcion);
			}
		else if (strncmp(opcion, "find", 4) == 0){
			find(opcion);
			}
		else if (strncmp(opcion, "stat", 4) == 0){
			estat(opcion);
			}
		else if (strcmp(opcion, "uname") == 0){
			unme();
			}
		else if (strcmp(opcion, "date") == 0){
			date();
			}
		else if (strcmp(opcion, "who") == 0){
			who();
			}
		else if (strcmp(opcion, "free") == 0){
			fre();
			}
		else if (strcmp(opcion, "ip") == 0){
			ip();
			}
		else if (strcmp(opcion, "mac") == 0){
			mac();
			}
		else if (strcmp(opcion, "numerosdisp") == 0){
			numerosdisp();
			}
    }
    return 0;
}

void pwd(){
    char directorio[1024]; // Buffer para almacenar la ruta
    if (getcwd(directorio, sizeof(directorio)) != NULL) {//
        printf("%s\n", directorio);
    } else {
        perror("Error en PWD");
    }
}

void cd(char *opcion){
	char *ruta; //un apuntador para la cadena que tiene la ruta
	ruta = strchr(opcion,' ')+1;//strchr te pasa un puntero desde el caracter buscado hasta el final de la cadena
	if(chdir(ruta)== -1){
		perror("Error en la ruta");
	}	
}

void mkdr(char *opcion){
	char *ruta;//lo mismo que arriba
	ruta = strchr(opcion,' ')+1;
	if(mkdir(ruta, 0777) == -1){
		perror("Error en algo ");
		}
}

void ls(char *opcion){
    int pl = 0, pa = 0, pi = 0; // banderas para las opciones l, a, i

    char *param = strchr(opcion, ' '); // Busca si hay parametros despues del comando
    if (param != NULL) {
        param++;
        if (strchr(param, 'l')) pl = 1; // Activa formato largo
        if (strchr(param, 'a')) pa = 1; // Activa mostrar ocultos
        if (strchr(param, 'i')) pi = 1; // Activa mostrar inodos
    }

    DIR *directorio;
    char ruta[1024];
    getcwd(ruta, sizeof(ruta)); // Obtiene directorio actual
    
    struct dirent *entradadir;
    struct stat sb;
    char rutacomp[1536];

    if ( (directorio = opendir(ruta)) == NULL){
        perror("Error\n");
        return;
    }

    while ( (entradadir = readdir(directorio)) != NULL){
        if (!pa && entradadir->d_name[0] == '.') continue; // Filtro de archivos ocultos

        snprintf(rutacomp, sizeof(rutacomp), "%s/%s", ruta, entradadir->d_name); // Ruta completa
        if (lstat(rutacomp, &sb) == -1) {
            perror("lstat");
            continue;
        }

        if (pi) { // Imprime numero de inodo si se pidio -i
            printf("%ju\t", (uintmax_t)sb.st_ino);
        }

        if (pl) { // Formato largo (permisos, dueño, tamaño, fecha)

            char tipo = '-'; // Determina el caracter de tipo de archivo
            if      (S_ISDIR(sb.st_mode))  tipo = 'd';
            else if (S_ISLNK(sb.st_mode))  tipo = 'l';
            else if (S_ISCHR(sb.st_mode))  tipo = 'c';
            else if (S_ISBLK(sb.st_mode))  tipo = 'b';
            else if (S_ISFIFO(sb.st_mode)) tipo = 'p';
            else if (S_ISSOCK(sb.st_mode)) tipo = 's';

            // Impresion de mascara de permisos en formato rwxrwxrwx
            printf("%c%c%c%c%c%c%c%c%c%c ",
                tipo,
                (sb.st_mode & S_IRUSR) ? 'r' : '-',
                (sb.st_mode & S_IWUSR) ? 'w' : '-',
                (sb.st_mode & S_IXUSR) ? 'x' : '-',
                (sb.st_mode & S_IRGRP) ? 'r' : '-',
                (sb.st_mode & S_IWGRP) ? 'w' : '-',
                (sb.st_mode & S_IXGRP) ? 'x' : '-',
                (sb.st_mode & S_IROTH) ? 'r' : '-',
                (sb.st_mode & S_IWOTH) ? 'w' : '-',
                (sb.st_mode & S_IXOTH) ? 'x' : '-'
            );
            char timebuf[64];
            strftime(timebuf, sizeof(timebuf), "%b %d %H:%M", localtime(&sb.st_mtime));
            printf("%ju %ju %ju %jd %s ",
                (uintmax_t)sb.st_nlink,
                (uintmax_t)sb.st_uid,
                (uintmax_t)sb.st_gid,
                (intmax_t)sb.st_size,
                timebuf);
        }

        printf("%s \n", entradadir->d_name); // Nombre del archivo/carpeta
    }
    closedir(directorio); // Cierra el directorio
}



void cat(char *opcion){
	char *ruta; //un apuntador para la cadena que tiene la ruta
	ruta = strchr(opcion,' ')+1;//strchr te pasa un puntero desde el caracter buscado hasta el final de la cadena
	
	struct stat sb;
	
	if(lstat(ruta, &sb) == -1){
		printf("Error");
		}
		
	switch (sb.st_mode & S_IFMT) {
         case S_IFBLK:  printf("block device\n");            break;
         case S_IFCHR:  printf("character device\n");        break;
         case S_IFDIR:  printf("directory\n");               break;
         case S_IFIFO:  printf("FIFO/pipe\n");               break;
         case S_IFLNK:  printf("symlink\n");                 break;
         case S_IFREG:  printf("regular file\n");            break;
         case S_IFSOCK: printf("socket\n");                  break;
         default:       printf("unknown?\n");                break;
         }
         
     if(S_IFMT==S_IFREG){
		int doc;
		doc=open(ruta,O_RDONLY);
		if(doc==-1){
			printf("error");
		}
		
	}
	
	}

void unlnk(char *opcion){
	char *ruta; //un apuntador para la cadena que tiene la ruta
	ruta = strchr(opcion,' ')+1;//strchr te pasa un puntero desde el caracter buscado hasta el final de la cadena
	if(unlink(ruta)==-1){
		perror("unlink");
		}
	}

void rname(char *opcion){
	char *rutacompleta; //un apuntador para la cadena que tiene la ruta
	char rutavieja[512];
	char *rutanueva;
	int num;
	rutacompleta = strchr(opcion,' ')+1;//strchr te pasa un puntero desde el caracter buscado hasta el final de la cadena
	rutanueva = strchr(rutacompleta,' ')+1;//nombre nuevo
	num = rutanueva - rutacompleta;
	strncpy(rutavieja,rutacompleta,sizeof(char)*num);
	rutavieja[num-1]='\0';
	if(rename(rutavieja,rutanueva)==-1){
		perror("rename");
		}
	}
/*
char dividir(char *texto){
	
	}
*/

void find(char *opcion){
	char *rutacompleta; //un apuntador para la cadena que tiene la ruta
	char ruta[512];
	char *nombre;
	int num;
	
	struct stat tipo;
	char rutadirec[1024];
	char rutarecursiva[1024];
	char prov[512];
	
	
	rutacompleta = strchr(opcion,' ')+1;//strchr te pasa un puntero desde el caracter buscado hasta el final de la cadena
	nombre = strchr(rutacompleta,' ')+1;//nombre nuevo
	num = nombre - rutacompleta; //calculo del tamaño de la ruta
	strncpy(ruta,rutacompleta,sizeof(char)*num);//copia la ruta en ruta
	ruta[num-1]='\0';
	
	DIR *directorio;
	struct dirent *contenido;
	
	if((directorio = opendir(ruta)) == NULL){
		fprintf (stderr, "No puedo abrir el directorio %s. Error %s\n", ruta, strerror(errno));
	}
	
	while ( (contenido = readdir (directorio) ) != NULL){
		if (strcmp(contenido->d_name, ".") == 0 || strcmp(contenido->d_name, "..") == 0) {
            continue;
        }//para ignorar /. y /.. para que no se cicle
		
		strcpy(rutadirec,ruta);//copia la ruta en rutadirect
		strcat(rutadirec,"/");//añade un /
		strcpy(prov,contenido ->d_name);//copia el nombre del archivo
		strcat(rutadirec,prov);	//concatena el nombre del archivo con la ruta
		
		if(stat(rutadirec, &tipo)==-1){
			printf("error");
			}
		
		if((tipo.st_mode & S_IFMT)== S_IFDIR){
			printf("directorio en cola\n");
			strcpy(rutarecursiva," ");
			strcat(rutarecursiva,rutadirec);
			strcat(rutarecursiva," ");
			strcat(rutarecursiva,nombre);
			find(rutarecursiva);
			}
		
		if(strcmp(contenido ->d_name,nombre)==0){
			printf("archivo encontrado \n");
			printf ("%s\n ", contenido ->d_name);
			printf("En la ruta: \n");
			pwd();
			}
	}
		
	
	closedir(directorio);
}

void estat(char *opcion){
	char *ruta; //un apuntador para la cadena que tiene la ruta
	ruta = strchr(opcion,' ')+1;//strchr te pasa un puntero desde el caracter buscado hasta el final de la cadena
	struct stat sb;
	
	if(stat(ruta, &sb)== -1){
		perror("stat");
		
		}
	
    printf("ID of containing device:  [%x,%x]\n",
		major(sb.st_dev),
        minor(sb.st_dev));

    printf("File type:                ");

    switch (sb.st_mode & S_IFMT) {
        case S_IFBLK:  printf("block device\n");            break;
        case S_IFCHR:  printf("character device\n");        break;
        case S_IFDIR:  printf("directory\n");               break;
        case S_IFIFO:  printf("FIFO/pipe\n");               break;
        case S_IFLNK:  printf("symlink\n");                 break;
        case S_IFREG:  printf("regular file\n");            break;
        case S_IFSOCK: printf("socket\n");                  break;
        default:       printf("unknown?\n");                break;
        }

    printf("I-node number:            %ju\n", (uintmax_t) sb.st_ino);

    printf("Mode:                     %jo (octal)\n",
        (uintmax_t) sb.st_mode);

    printf("Link count:               %ju\n", (uintmax_t) sb.st_nlink);
    printf("Ownership:                UID=%ju   GID=%ju\n",
        (uintmax_t) sb.st_uid, (uintmax_t) sb.st_gid);

    printf("Preferred I/O block size: %jd bytes\n",
        (intmax_t) sb.st_blksize);
    printf("File size:                %jd bytes\n",
        (intmax_t) sb.st_size);
    printf("Blocks allocated:         %jd\n",
        (intmax_t) sb.st_blocks);

    printf("Last status change:       %s", ctime(&sb.st_ctime));
    printf("Last file access:         %s", ctime(&sb.st_atime));
    printf("Last file modification:   %s", ctime(&sb.st_mtime));
	}

void unme() {
    struct utsname info;

    if (uname(&info) == -1) {
        perror("uname");
        return;
    }

    printf("Nombre del sistema:  %s\n", info.sysname);
    printf("Nombre del nodo:     %s\n", info.nodename);
    printf("Release del kernel:  %s\n", info.release);
    printf("Versión del kernel:  %s\n", info.version);
    printf("Arquitectura: %s\n", info.machine);
    
}


void date(){
	time_t t = time(NULL);
	if(t == (time_t)-1){ 
		perror("time"); return; }
	printf("%s", ctime(&t));
}


void who(){
    struct utmp *entrada; // Estructura para registros de usuarios
    setutent(); // Abre o reinicia la lectura del archivo utmp
    while( (entrada = getutent()) != NULL ){ // Lee cada entrada del archivo
        if(entrada->ut_type == USER_PROCESS){ // Filtra solo procesos de usuario reales
            time_t t = (time_t)entrada->ut_tv.tv_sec; // Segundos del login
            char timebuf[32]; // Buffer para la fecha formateada
            strftime(timebuf, sizeof(timebuf), "%Y-%m-%d %H:%M", localtime(&t));
            printf("%-12s %-10s %s (%s)\n",entrada->ut_user,entrada->ut_line,timebuf,entrada->ut_host);
        }
    }
    endutent(); // Cierra el archivo utmp
}


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

void ip(){
    struct ifconf ifc; // Estructura para lista de interfaces
    struct ifreq  ifr_buf[64]; // Buffer para guardar datos de hasta 64 interfaces
    char sbuf[64]; // Buffer para la IP en texto

    int sock = socket(AF_INET, SOCK_DGRAM, 0); // Socket para consultas de red
    if(sock == -1){ perror("socket"); return; }

    ifc.ifc_len = sizeof(ifr_buf);
    ifc.ifc_buf = (char *)ifr_buf;

    if(ioctl(sock, SIOCGIFCONF, &ifc) == -1){ // Obtiene la configuracion de interfaces
        perror("ioctl SIOCGIFCONF"); 
        close(sock); return; }

    int n = ifc.ifc_len / sizeof(struct ifreq); // Calcula numero de interfaces encontradas
    for(int i = 0; i < n; i++){
        struct ifreq *item = &ifr_buf[i];
        
        if(ioctl(sock, SIOCGIFADDR, item) == -1) continue; // Pide la IP de la interfaz
        struct sockaddr_in *addr = (struct sockaddr_in *)&item->ifr_addr;
        inet_ntop(AF_INET, &addr->sin_addr, sbuf, sizeof(sbuf)); // Convierte binario a texto
        printf("%-12s  IP: %s\n", item->ifr_name, sbuf);
    }
    close(sock); // Cierra el socket
}

void mac() {
    struct ifconf ifc; // Estructura para configurar peticiones de red
    struct ifreq ifr_buf[64]; // Arreglo para almacenar datos de interfaces

    int sock = socket(AF_INET, SOCK_DGRAM, 0); // Socket necesario para ioctl
    if (sock == -1) { 
        perror("socket"); 
        return; 
    }

    ifc.ifc_len = sizeof(ifr_buf);
    ifc.ifc_buf = (char *)ifr_buf;

    if (ioctl(sock, SIOCGIFCONF, &ifc) == -1) { // Obtiene la lista de interfaces
        perror("ioctl SIOCGIFCONF"); 
        close(sock); 
        return; 
    }

    int n = ifc.ifc_len / sizeof(struct ifreq);
    
    for (int i = 0; i < n; i++) {
        struct ifreq item;
        
        memset(&item, 0, sizeof(struct ifreq)); // Limpia la estructura destino
        memcpy(item.ifr_name, ifr_buf[i].ifr_name, IFNAMSIZ - 1); // Copia nombre de interfaz

        if (ioctl(sock, SIOCGIFHWADDR, &item) == -1) { // Obtiene direccion fisica (MAC)
            continue;
        }

        unsigned char *mac = (unsigned char *)item.ifr_hwaddr.sa_data; // Puntero a los bytes de la MAC

        printf("%-12s MAC: %02x:%02x:%02x:%02x:%02x:%02x\n",
               item.ifr_name,
               mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
    }

    close(sock); // Libera el socket
}

void numerosdisp(){
    DIR *d = opendir("/dev"); // Abre el directorio de dispositivos
    if(d == NULL){ perror("opendir /dev"); return; }

    struct dirent *e; // Para leer entradas del directorio
    struct stat   sb; // Para obtener info de cada archivo
    char        ruta[512]; // Ruta completa al archivo en /dev

    printf("%-30s %-10s %6s %6s\n", "Dispositivo", "Tipo", "Major", "Minor"); //con tipo
    printf("%-30s %-10s %6s %6s\n", "-----------", "----", "-----", "-----"); 
    //printf("%-30s  %6s %6s\n", "Dispositivo", "Major", "Minor");//sin tipo
    //printf("%-30s  %6s %6s\n", "-----------", "-----", "-----");

    while( (e = readdir(d)) != NULL ){
        if(e->d_name[0] == '.') continue; // Ignora archivos ocultos
        snprintf(ruta, sizeof(ruta), "/dev/%s", e->d_name); // Construye la ruta /dev/nombre
        if(lstat(ruta, &sb) == -1) continue;

        // Solo procesa si es dispositivo de bloque o caracteres
        if(!S_ISBLK(sb.st_mode) && !S_ISCHR(sb.st_mode)) continue;

        char *tipo = S_ISBLK(sb.st_mode) ? "bloque" : "caracter";
        printf("%-30s %-10s %6u %6u\n",
        //printf("%-30s %6u %6u\n",//para sin tipo
            e->d_name,
            tipo,//pues el tipo
            major(sb.st_rdev), // Extrae el Major ID
            minor(sb.st_rdev)); // Extrae el Minor ID
    }
    closedir(d); // Cierra el directorio
}
```

- - las mejoras a este codigo son muchas y siendo sincero las que pondre aqui no seran todas ya que todavia no tengo la habilidad suficiente para identificar como podria mejorar todo el codigo, pero aqui hay algunas que puedo poner.

- - Primera mejora: terminar el minishell, ya que hay algunas funcionalidades que no estan terminadas.

- - Uso de `perror()` sobre `printf()`: En funciones como cat y find, uso `printf()` para imprimir "Error" o "error". Es mejor usar `perror("cat")`, ya que esto traduce automáticamente el código de error global en (errno).

- - Validación de entrada en comandos con argumentos: Usualmente uso `strchr(opcion, ' ') + 1` en. Si el usuario escribe solo el comando (ej. "cd" sin espacio), strchr devolverá NULL y el programa sufrirá un Segmentation Fault. Se debe validar si el puntero es nulo antes que nada.

- - Control de desbordamiento de búfer: En rname y find, uso strncpy y strcpy con tamaños fijos como 512. Si una ruta es muy larga, podrías causar un desbordamiento. En este caso podria validar longitudes antes de copiar o buscar algo para tener la longitud maxima de una dirección.

- - Mejorar la logica de mis funciones.

- - No se hasta que punto esto se pueda pero tal vez cambiar los `if()` de la funcion principal por un `switch()`.


> En estos temas aprendí mucho en cuanto a tipos de archivos, estructuras, etc. aunque siento que el conocimiento no fue tan bien digerido por la falta de tiempo y practica pero espero en un futuro seguir practicando y mejorar en cuanto a mi forma de programar.

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

