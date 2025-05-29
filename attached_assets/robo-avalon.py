from avalonaapi.stable_api import Avalon
from avalonaapi.constants import ACTIVES
from encodings.utf_8 import getregentry
from functools import reduce
import time
from configobj import ConfigObj
import json, sys
import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
from tabulate import tabulate
from colorama import init, Fore, Back, Style 
from threading import Thread
import getpass
import base64
import os
import logging
import urllib
import pickle
import signal
import atexit
import json
import sys
import os
import re
# Importações para PyTorch e pré-processamento
import torch
import torch.nn as nn
import torch.optim as optim
from colorama import Fore
from rich.console import Console
from rich.panel import Panel
from rich.text import Text
from rich import style
from prompt_toolkit import PromptSession
from prompt_toolkit.styles import Style
from prompt_toolkit.shortcuts import button_dialog
from prompt_toolkit.validation import Validator, ValidationError
from cryptography.fernet import Fernet
import hashlib


init(autoreset=True)
green = Fore.GREEN
yellow = Fore.YELLOW
greenf = Back.GREEN
yellowf = Back.YELLOW
light_blue = Fore.LIGHTBLUE_EX
red = Fore.RED
redf = Back.RED
white = Fore.WHITE
whitef = Back.WHITE
cyan = Fore.CYAN
cyanf = Back.CYAN
blue = Fore.BLUE
bluef = Back.BLUE
magenta = Fore.MAGENTA
magentaf = Back.MAGENTA
Console = Console()

print(cyan + '\n\n*************************************************************************************************\n\n')
print(cyan+'''
         ██╗      ██████╗  ██████╗  █████╗ ███╗   ██╗    ███████╗███╗   ███╗██╗████████╗██╗  ██╗
         ██║     ██╔═══██╗██╔════╝ ██╔══██╗████╗  ██║    ██╔════╝████╗ ████║██║╚══██╔══╝██║  ██║
         ██║     ██║   ██║██║  ███╗███████║██╔██╗ ██║    ███████╗██╔████╔██║██║   ██║   ███████║
         ██║     ██║   ██║██║   ██║██╔══██║██║╚██╗██║    ╚════██║██║╚██╔╝██║██║   ██║   ██╔══██║
         ███████╗╚██████╔╝╚██████╔╝██║  ██║██║ ╚████║    ███████║██║ ╚═╝ ██║██║   ██║   ██║  ██║
         ╚══════╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝    ╚══════╝╚═╝     ╚═╝╚═╝   ╚═╝   ╚═╝  ╚═╝
                              ████████╗██████╗ ███████╗██████╗ ███████╗██████╗ 
                              ╚══██╔══╝██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔══██╗
                                 ██║   ██████╔╝███████║██║  ██║█████╗  ██████╔╝
                                 ██║   ██╔══██╗██╔══██║██║  ██║██╔══╝  ██╔══██╗
                                 ██║   ██║  ██║██║  ██║██████╔╝███████╗██║  ██║
                                 ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝
                                                azkzero@gmail.com
''')
print(cyan + '\n\n************************************************************************************************\n\n')


# Variáveis globais
par_com_loss = []
par_anterior = None
novo = [
    (1, "EUR/USD"),
    (2, "GBP/USD"),
    (3, "AUD/USD"),
    (4, "USD/JPY"),
]
compra_resultado = None
all_asset = ''
payouts_total = ''
API = None
cifrao = ''
par = "EURUSD-OTC"
mudar_automatico = False
tempo_restante = 1
# Definir cor verde para o título
green = "\033[92m"
reset = "\033[0m"
RESET_ALL = "\033[0m"  # Código ANSI para resetar a cor


# Exibir título estilizado
Console.print(Panel(Text("== LOGIN ==", justify="center", style="bold cyan"), expand=False))

# Caminho do arquivo onde as credenciais serão armazenadas
CREDENTIALS_FILE = "credentials.json"
KEY_FILE = "key.key"

# Função para gerar e armazenar uma chave de criptografia
def generate_key():
    if not os.path.exists(KEY_FILE):
        key = Fernet.generate_key()
        with open(KEY_FILE, "wb") as key_file:
            key_file.write(key)

# Função para carregar a chave de criptografia
def load_key():
    if os.path.exists(KEY_FILE):
        return open(KEY_FILE, "rb").read()
    return None

# Função para salvar credenciais criptografadas
def save_credentials(email, senha):
    key = load_key()
    if key is None:
        generate_key()
        key = load_key()

    cipher = Fernet(key)
    credenciais = {"email": email, "senha": cipher.encrypt(senha.encode()).decode()}
    
    with open(CREDENTIALS_FILE, "w") as file:
        json.dump(credenciais, file)

# Função para carregar credenciais salvas
def load_credentials():
    if os.path.exists(CREDENTIALS_FILE):
        key = load_key()
        if key:
            cipher = Fernet(key)
            with open(CREDENTIALS_FILE, "r") as file:
                credenciais = json.load(file)
                credenciais["senha"] = cipher.decrypt(credenciais["senha"].encode()).decode()
                return credenciais
    return None

  
    # Tela de login
def login():
    credenciais = load_credentials()
    
    if credenciais:
        Console.print(f"\n🔑 [green]Login automático bem-sucedido! Bem-vindo, {credenciais['email']}.[/green]\n")
        return credenciais["email"], credenciais["senha"]

    # Captura login e senha do usuário
    email = Console.input("[bold yellow]Digite seu E-mail: [/bold yellow]")
    senha = Console.input("[bold yellow]Digite sua Senha: [/bold yellow]", password="*")

    save_credentials(email, senha)
    Console.print("[green]Credenciais salvas com sucesso![/green]\n")
    
    return email, senha  # Retorna os dados para serem usados depois

# Executa o login e recebe os dados
email, senha = login()

# Verificar se a senha é "1"
if senha == "1":
    Console.print("[bold red]❌ Login incorreto. Por favor, tente novamente.[/bold red]")
else:
    Console.print(f"\n[bold green]✅ Login bem-sucedido![/bold green]")


# Função para capturar input com valor padrão
def get_input(mensagem, valor_padrao, tipo=float):
    entrada = input(f"{mensagem} ({valor_padrao}): ")
    return tipo(entrada) if entrada.strip() else valor_padrao

velas = ''
tempo_restante = 0
ativos = ''
ativo = "EURUSD"
exp = 1
segundos = 30
melhor_par = 0
### CRIANDO ARQUIVO DE CONFIGURAÇÃO ####
# Definição direta do tipo
tipo = "automatico"
qnt_velas = 5  # Valor padrão
timeframe = 60  # Valor padrão
pay_minimo = 80.0  # Valor padrão
rsi_minimo = 30  # Valor padrão
rsi_maximo = 70  # Valor padrão
stop = True
soros = False
valor_soros = 0
lucro_op_atual = 0
niveis_soros = 0
nivel_soros = 0
stop = True
fator_martingale = 0
valor_soros = 0
lucro_op_atual = 0
lucro_total = 0
# Inputs automáticos
analise_medias = "N"
velas_medias = 5
valor_entrada = 0

print("Iniciando Conexão com a Avalon")
API = Avalon(email, senha)
### Função para conectar na Avalon ###
check, reason = API.connect()
if check:
    print('\nConectado com sucesso')
else:
    if reason == '{"code":"invalid_credentials","message":"You entered the wrong credentials. Please ensure that your login/password is correct."}':
        print('\nEmail ou senha incorreta')
        sys.exit()
    else:
        print('\nHouve um problema na conexão')
        print(reason)
        sys.exit()

while True:
    escolha = input(Fore.GREEN +'\n>>'+Fore.WHITE+' Qual conta deseja conectar?\n'+ Fore.GREEN+' 1 - '+ Fore.WHITE+'DEMO \n'+ Fore.GREEN+' 2 - '+ Fore.WHITE+'REAL \n'+ Fore.GREEN+'--> ')
    try:
        escolha = int(escolha)
        if escolha == 1:
            conta = 'PRACTICE'
            escolha = 'Demo'
            print(Fore.GREEN + '\n>> Conta demo selecionada')
            break
        elif escolha == 2:
            conta = 'REAL'
            escolha = 'Real'
            print(Fore.GREEN+ '\n>> Conta real selecionada')
            break
        else:
            print(Fore.RED +'>> Opção inválida - Digite 1 ou 2')
            continue
    except:
        print(Fore.RED +'>> Opção inválida - Digite 1 ou 2')

# Adicionando a escolha de uso do Martingale no terminal
while True:
    usar_martingale = input(Fore.GREEN + '\n>>' + Fore.WHITE + ' Deseja usar Martingale?\n' + Fore.GREEN + ' 1 - ' + Fore.WHITE + 'SIM\n' + Fore.GREEN + ' 2 - ' + Fore.WHITE + 'NÃO\n' + Fore.GREEN + '--> ')
    try:
        usar_martingale = int(usar_martingale)
        if usar_martingale == 1:
            martingale = True
            print(Fore.GREEN + '\n>> Martingale ativado')
            # Escolha do número de níveis do Martingale
            while True:
                niveis_martingale = input(Fore.GREEN + '\n>>' + Fore.WHITE + ' Digite o número de níveis do Martingale (0-10): ')
                try:
                    niveis_martingale = int(niveis_martingale)
                    if 0 <= niveis_martingale <= 10:
                        martingale = niveis_martingale
                        print(Fore.GREEN + f'\n>> Níveis de Martingale definidos como {niveis_martingale}')
                        break
                    else:
                        print(Fore.RED + '>> Valor inválido - Digite um número entre 0 e 10')
                except:
                    print(Fore.RED + '>> Opção inválida - Digite um número inteiro')
            # Escolha do fator do Martingale
            while True:
                fator_martingale = input(Fore.GREEN + '\n>>' + Fore.WHITE + ' Digite o fator do Martingale (ex: 2.0): ')
                try:
                    fator_martingale = float(fator_martingale)
                    if fator_martingale > 1.0:
                        fator_mg = fator_martingale
                        print(Fore.GREEN + f'\n>> Fator de Martingale definido como {fator_mg}')
                        break
                    else:
                        print(Fore.RED + '>> Valor inválido - Digite um número maior que 1.0')
                except:
                    print(Fore.RED + '>> Opção inválida - Digite um número decimal')
            break
        elif usar_martingale == 2:
            martingale = 0
            print(Fore.GREEN + '\n>> Martingale desativado')
            break
        else:
            print(Fore.RED + '>> Opção inválida - Digite 1 ou 2')
            continue
    except:
        print(Fore.RED + '>> Opção inválida - Digite 1 ou 2')

# Adicionando a escolha de Gale Invertido no terminal
while True:
    gale_invertido = input(Fore.GREEN + '\n>>' + Fore.WHITE + ' Deseja usar Gale Invertido?\n' + Fore.GREEN + ' 1 - ' + Fore.WHITE + 'SIM (Inverter direção no Gale)\n' + Fore.GREEN + ' 2 - ' + Fore.WHITE + 'NÃO (Manter direção no Gale)\n' + Fore.GREEN + '--> ')
    try:
        gale_invertido = int(gale_invertido)
        if gale_invertido == 1:
            inverter_gale = 'S'
            print(Fore.GREEN + '\n>> Gale Invertido ativado (direção será invertida no Gale)')
            break
        elif gale_invertido == 2:
            inverter_gale = 'N'
            print(Fore.GREEN + '\n>> Gale Invertido desativado (direção será mantida no Gale)')
            break
        else:
            print(Fore.RED + '>> Opção inválida - Digite 1 ou 2')
            continue
    except:
        print(Fore.RED + '>> Opção inválida - Digite 1 ou 2')

# Adicionando a escolha de uso do Soros no terminal
while True:
    usar_soros = input(Fore.GREEN + '\n>>' + Fore.WHITE + ' Deseja usar Soros?\n' + Fore.GREEN + ' 1 - ' + Fore.WHITE + 'SIM\n' + Fore.GREEN + ' 2 - ' + Fore.WHITE + 'NÃO\n' + Fore.GREEN + '--> ')
    try:
        usar_soros = int(usar_soros)
        if usar_soros == 1:
            soros = True
            print(Fore.GREEN + '\n>> Soros ativado')
            # Escolha do número de níveis do Soros
            while True:
                niveis_soros_input = input(Fore.GREEN + '\n>>' + Fore.WHITE + ' Digite o número de níveis do Soros (0-10): ')
                try:
                    niveis_soros_input = int(niveis_soros_input)
                    if 0 <= niveis_soros_input <= 10:
                        niveis_soros = niveis_soros_input
                        nivel_soros = 0
                        print(Fore.GREEN + f'\n>> Níveis de Soros definidos como {niveis_soros}')
                        break
                    else:
                        print(Fore.RED + '>> Valor inválido - Digite um número entre 0 e 10')
                except:
                    print(Fore.RED + '>> Opção inválida - Digite um número inteiro')
            break
        elif usar_soros == 2:
            soros = False
            niveis_soros = 0
            nivel_soros = 0
            print(Fore.GREEN + '\n>> Soros desativado')
            break
        else:
            print(Fore.RED + '>> Opção inválida - Digite 1 ou 2')
            continue
    except:
        print(Fore.RED + '>> Opção inválida - Digite 1 ou 2')

API.change_balance(conta)
def verificar_conexao():
    conectado = True
    while True:
        if API.check_connect():
            if not conectado:
                print(green + "Conexão restaurada com sucesso.")
                conectado = True
        else:
            if conectado:
                print(red + "Perda de conexão com o servidor. Tentando reconectar...")
                conectado = False
            reconnect(API)
        time.sleep(10)

def check_stop():
    global stop, lucro_total
    if lucro_total <= float('-'+str(abs(stop_loss))):
        stop = False
        print(Fore.WHITE + Back.RED+'\n ######################### ')
        print(red+'  STOP LOSS BATIDO ',str(cifrao),str(lucro_total))
        print(Fore.WHITE + Back.RED+' ########################### ')
        input(' ➥  Aperte enter para sair')       
    if lucro_total >= float(abs(stop_win)):
        stop = False
        print(Fore.WHITE + Back.YELLOW+'\n ######################### ')
        print(green+'  STOP WIN BATIDO ',str(cifrao),str(lucro_total))
        print(Fore.WHITE + Back.YELLOW+' ########################### ')
        input(' ➥  Aperte enter para sair')

def payout(par):
    global profit, all_asset, pay_minimo, binary, turbo, digital
    pay_minimo = float(config["AJUSTES"]["pay_minimo"])
    try:
        if all_asset["binary"][par]["open"]:
            if profit[par]["binary"] > 0:
                binary = round(profit[par]["binary"], 2) * 100
            else:
                binary = 0
        else:
            binary = 0
    except:
        binary = 0
    try:
        if all_asset["turbo"][par]["open"]:
            if profit[par]["turbo"] > 0:
                turbo = round(profit[par]["turbo"], 2) * 100
            else:
                turbo = 0
        else:
            turbo = 0
    except:
        turbo = 0
    try:
        if all_asset["digital"][par]["open"]:
            digital = API.get_digital_payout(par)
        else:
            digital = 0
    except:
        digital = 0
    return binary, turbo, digital

def escolher_par_manual():
    global ativo
    all_assets = API.get_all_open_time()
    all_profits = API.get_all_profit()
    
    ativos_disponiveis = []
    for ativo, info in all_assets['digital'].items():
        if info['open']:
            payout_digital = API.get_digital_payout(ativo)
            ativos_disponiveis.append((ativo, payout_digital))
    
    print(f"{green}Ativos digitais disponíveis:")
    for i, (ativo, payout) in enumerate(ativos_disponiveis, start=1):
        print(f"{i}. {ativo} - Payout: {payout:.2f}%")
    
    escolha = int(input(f"{green}Escolha o número do ativo: ")) - 1
    if 0 <= escolha < len(ativos_disponiveis):
        ativo = ativos_disponiveis[escolha][0]
        print(f"{green}Ativo escolhido: {ativo}")
        return ativo, 'digital'
    else:
        print(f"{red}Escolha inválida.")
        return None, None

def escolher_modo_operacao():
    while True:
        try:
            escolha = int(input(Fore.GREEN + '\n>>' + Fore.WHITE + ' Escolha o modo de operação:\n' +
                                Fore.GREEN + ' 1 - ' + Fore.WHITE + 'Manual (escolher único ativo para as entradas)\n' +
                                Fore.GREEN + ' 2 - ' + Fore.WHITE + 'Manual 2 (escolher o ativo a cada entrada)\n' +
                                Fore.GREEN + ' 3 - ' + Fore.WHITE + 'Automático (escolher modo automático)\n' +
                                Fore.GREEN + '--> '))
            if escolha == 1:
                escolher_par_manual()
                return "manual"
            elif escolha == 2:
                return "manual 2"
            elif escolha == 3:
                return "automatico"
            else:
                print(Fore.RED + '>> Escolha incorreta! Digite 1, 2 ou 3.')
        except ValueError:
            print(Fore.RED + '>> Digite um número válido (1 2 ou 3).')

win_count = 0
win_gale1_count = 0
win_gale2_count = 0
win_gale3_count = 0
win_gale4_count = 0
win_gale5_count = 0
win_gale6_count = 0
win_gale7_count = 0
win_gale8_count = 0
win_gale9_count = 0
win_gale10_count = 0
loss_count = 0
total_entradas = 0

def compra(ativo, valor_entrada, direcao, exp, tipo):
    global stop, lucro_total, nivel_soros, niveis_soros, valor_soros, lucro_op_atual
    global win_count, win_gale1_count, win_gale2_count, win_gale3_count, win_gale4_count, win_gale5_count, win_gale6_count, win_gale7_count, win_gale8_count, win_gale9_count, win_gale10_count, loss_count, total_entradas
    print(f"Compra realizada: Ativo {melhor_par}, Entrada {valor_entrada}, Direção {direcao}, Expiração {exp}, Tipo {tipo}")
    compra_resultado = None
    
    if soros:
        if nivel_soros == 0:
            entrada = valor_entrada
        if nivel_soros >= 1 and valor_soros > 0 and nivel_soros <= niveis_soros:
            entrada = valor_entrada + valor_soros
        if nivel_soros > niveis_soros:
            lucro_op_atual = 0
            valor_soros = 0
            entrada = valor_entrada
            nivel_soros = 0
    else:
        entrada = valor_entrada
        
    direcao_atual = direcao
    for i in range(martingale + 1):
        if stop == True:      
            if tipo == 'digital':
                check, id = API.buy_digital_spot_v2(ativo, entrada, direcao_atual, exp)
            else:
                check, id = API.buy(entrada, ativo, direcao_atual, exp)
            if check:
                total_entradas += 1
                if i == 0:
                    print(
                        yellow + "\n>> Ordem aberta" + green + " \n>> Par:",
                        ativo,
                        green + "\n>> Timeframe:",
                        exp,
                        yellow + "\n>> Entrada de:",
                        cifrao,
                        entrada,
                    )
                if i >= 1:
                    print(
                        yellow + "\n>> Ordem aberta para gale",
                        str(i),
                        green + "\n>> Par:",
                        ativo,
                        yellow + "\n>> Timeframe:",
                        exp,
                        green + "\n>> Entrada de:",
                        cifrao,
                        entrada,
                    )
                while True:
                    time.sleep(0.1)
                    status, resultado = (
                        API.check_win_digital_v2(id)
                        if tipo == "digital"
                        else API.check_win_v4(id)
                    )
                    if status:
                        lucro_total += round(resultado, 2)
                        valor_soros += round(resultado, 2)
                        lucro_op_atual += round(resultado, 2)

                        if resultado > 0:
                            resultado_final = True
                            if i == 0:
                                win_count += 1
                                compra_resultado = "WIN"
                                print(
                                    green
                                    + "\n>> Resultado: WIN"
                                    + green
                                    + " \n>> Lucro:",
                                    round(resultado, 2),
                                    green + "\n>> Par:",
                                    ativo,
                                    green + "\n>> Lucro total: ",
                                    round(lucro_total, 2),
                                )
                            elif i == 1:
                                win_gale1_count += 1
                                compra_resultado = "WIN"
                                print(
                                    green + "\n>> Resultado: WIN no gale",
                                    str(i),
                                    green + "\n>> Lucro:",
                                    round(resultado, 2),
                                    green + "\n>> Par:",
                                    ativo,
                                    green + "\n>> Lucro total: ",
                                    round(lucro_total, 2),
                                )
                            # ... (outras condições de gale mantidas)
                        elif resultado == 0:
                            compra_resultado = "EMPATE"
                            if i == 0:
                                print(
                                    yellow
                                    + "\n>> Resultado: EMPATE"
                                    + green
                                    + " \n>> Lucro:",
                                    round(resultado, 2),
                                    green + "\n>> Par:",
                                    ativo,
                                    green + "\n>> Lucro total: ",
                                    round(lucro_total, 2),
                                )
                            else:
                                print(
                                    yellow + "\n>> Resultado: EMPATE no gale",
                                    str(i),
                                    green + "\n>> Lucro:",
                                    round(resultado, 2),
                                    green + "\n>> Par:",
                                    ativo,
                                    green + "\n>> Lucro total: ",
                                    round(lucro_total, 2),
                                )
                            if i + 1 <= martingale:
                                gale = float(entrada)
                                entrada = round(abs(gale), 2)
                        else:
                            resultado_final = False
                            compra_resultado = "LOSS"
                            if i == 0:
                                loss_count += 1
                                print(
                                    red
                                    + "\n>> Resultado: LOSS"
                                    + yellow
                                    + " \n>> Lucro:",
                                    round(resultado, 2),
                                    green + "\n>> Par:",
                                    ativo,
                                    red + "\n>> Lucro total: ",
                                    round(lucro_total, 2),
                                )
                            elif i >= 1:
                                loss_count += 1
                                print(
                                    red + "\n>> Resultado: LOSS no gale",
                                    red + str(i),
                                    yellow + "\n>> Lucro:",
                                    round(resultado, 2),
                                    green + "\n>> Par:",
                                    ativo,
                                    red + "\n>> Lucro total: ",
                                    round(lucro_total, 2),
                                )                         
                            if i + 1 <= martingale:
                                gale = float(entrada) * float(fator_mg)
                                entrada = round(abs(gale), 2)
                                if inverter_gale == "S":
                                    direcao_atual = "put" if direcao_atual == "call" else "call"

                        check_stop()
                        break

                if resultado > 0:
                    break
            else:
                print(red + "erro na abertura da ordem,", id, ativo)

    if soros:
        if lucro_op_atual > 0:
            nivel_soros += 1
            lucro_op_atual = 0
        else:
            valor_soros = 0
            nivel_soros = 0
            lucro_op_atual = 0
            
    exibir_contadores()

def exibir_contadores():
    global win_count, win_gale1_count, win_gale2_count, win_gale3_count, win_gale4_count, win_gale5_count, win_gale6_count, win_gale7_count, win_gale8_count, win_gale9_count, win_gale10_count, loss_count, total_entradas
    print(yellow + "\n===== Contadores de Resultados =====")
    print(blue + ">> Total de Entradas:", total_entradas)
    print(green + ">> WIN:", win_count)
    print(green + ">> WIN no Gale 01:", win_gale1_count)
    print(green + ">> WIN no Gale 02:", win_gale2_count)
    print(green + ">> WIN no Gale 03:", win_gale3_count)
    print(green + ">> WIN no Gale 04:", win_gale4_count)
    print(green + ">> WIN no Gale 05:", win_gale5_count)
    print(green + ">> WIN no Gale 06:", win_gale6_count)
    print(green + ">> WIN no Gale 07:", win_gale7_count)
    print(green + ">> WIN no Gale 08:", win_gale8_count)
    print(green + ">> WIN no Gale 09:", win_gale9_count)
    print(green + ">> WIN no Gale 10:", win_gale10_count)
    print(red + ">> LOSS:", loss_count)
    print(yellow + "====================================")

def lucro_tot(lucro_total):
    if lucro_total == 0:
        return white + cifrao + ' '+str(round(lucro_total,2))
    if lucro_total > 0:
        return green + cifrao + ' '+str(round(lucro_total,2))
    if lucro_total < 0:
        return red + cifrao + ' '+str(round(lucro_total,2))

def horario():
    x = API.get_server_timestamp()
    now = datetime.fromtimestamp(API.get_server_timestamp())
    return now

def medias(velas):
    soma = 0
    for i in velas:
        soma += i['close']
    media = soma / velas_medias
    if media > velas[-1]['close']:
        tendencia = 'put'
    else:
        tendencia = 'call'
    return tendencia

def determine_direction(velas, strategy, trend_threshold=0.7, reversal_candles=5):
    """Determina a direção (call/put) com base na estratégia escolhida"""
    if not velas or len(velas) < reversal_candles:
        print(f"{red}Dados insuficientes para análise (mínimo {reversal_candles} velas). Usando aleatório.")
        return random.choice(['call', 'put'])

    if strategy == 'trend':
        bullish = sum(1 for c in velas[-reversal_candles:] if c['close'] > c['open'])
        bearish = sum(1 for c in velas[-reversal_candles:] if c['close'] < c['open'])
        total = bullish + bearish
        
        if total == 0:
            return random.choice(['call', 'put'])
        
        bullish_ratio = bullish / total
        bearish_ratio = bearish / total
        
        if bullish_ratio >= trend_threshold:
            return 'call'
        elif bearish_ratio >= trend_threshold:
            return 'put'
        return random.choice(['call', 'put'])

    elif strategy == 'rsi':
        period = min(14, len(velas))
        closes = [c['close'] for c in velas[-period:]]
        if len(closes) < period:
            return random.choice(['call', 'put'])
        
        gains = []
        losses = []
        for i in range(1, len(closes)):
            diff = closes[i] - closes[i-1]
            if diff > 0:
                gains.append(diff)
                losses.append(0)
            else:
                gains.append(0)
                losses.append(abs(diff))
        
        if not gains or not losses:
            return random.choice(['call', 'put'])
        
        avg_gain = sum(gains) / len(gains)
        avg_loss = sum(losses) / len(losses)
        
        if avg_loss == 0:
            rsi = 100
        else:
            rs = avg_gain / avg_loss
            rsi = 100 - (100 / (1 + rs))
        
        print(f"{white}RSI atual: {round(rsi, 2)}")
        if rsi < 30:
            return 'call'
        elif rsi > 70:
            return 'put'
        return random.choice(['call', 'put'])

    elif strategy == 'reversal':
        last_n = velas[-reversal_candles:]
        all_bullish = all(c['close'] > c['open'] for c in last_n)
        all_bearish = all(c['close'] < c['open'] for c in last_n)
        
        if all_bullish:
            return 'put'
        elif all_bearish:
            return 'call'
        return random.choice(['call', 'put'])

    elif strategy == 'rsi+trend':
        period = min(14, len(velas))
        closes = [c['close'] for c in velas[-period:]]
        if len(closes) < period:
            return random.choice(['call', 'put'])
        
        gains = []
        losses = []
        for i in range(1, len(closes)):
            diff = closes[i] - closes[i-1]
            if diff > 0:
                gains.append(diff)
                losses.append(0)
            else:
                gains.append(0)
                losses.append(abs(diff))
        
        if not gains or not losses:
            return random.choice(['call', 'put'])
        
        avg_gain = sum(gains) / len(gains)
        avg_loss = sum(losses) / len(losses)
        
        if avg_loss == 0:
            rsi = 100
        else:
            rs = avg_gain / avg_loss
            rsi = 100 - (100 / (1 + rs))
        
        bullish = sum(1 for c in velas[-reversal_candles:] if c['close'] > c['open'])
        bearish = sum(1 for c in velas[-reversal_candles:] if c['close'] < c['open'])
        total = bullish + bearish
        
        if total == 0:
            return random.choice(['call', 'put'])
        
        bullish_ratio = bullish / total
        bearish_ratio = bearish / total
        
        print(f"{white}RSI atual: {round(rsi, 2)} - Tendência: {round(bullish_ratio*100, 2)}% alta, {round(bearish_ratio*100, 2)}% baixa")
        
        if rsi < 30 and bullish_ratio >= trend_threshold:
            return 'call'
        elif rsi > 70 and bearish_ratio >= trend_threshold:
            return 'put'
        return random.choice(['call', 'put'])

    elif strategy == 'rsi+reversal':
        period = min(14, len(velas))
        closes = [c['close'] for c in velas[-period:]]
        if len(closes) < period:
            return random.choice(['call', 'put'])
        
        gains = []
        losses = []
        for i in range(1, len(closes)):
            diff = closes[i] - closes[i-1]
            if diff > 0:
                gains.append(diff)
                losses.append(0)
            else:
                gains.append(0)
                losses.append(abs(diff))
        
        if not gains or not losses:
            return random.choice(['call', 'put'])
        
        avg_gain = sum(gains) / len(gains)
        avg_loss = sum(losses) / len(losses)
        
        if avg_loss == 0:
            rsi = 100
        else:
            rs = avg_gain / avg_loss
            rsi = 100 - (100 / (1 + rs))
        
        last_n = velas[-reversal_candles:]
        all_bullish = all(c['close'] > c['open'] for c in last_n)
        all_bearish = all(c['close'] < c['open'] for c in last_n)
        
        print(f"{white}RSI atual: {round(rsi, 2)} - Últimas {reversal_candles} velas: {'Alta' if all_bullish else 'Baixa' if all_bearish else 'Mista'}")
        
        if rsi < 30 and all_bearish:
            return 'call'
        elif rsi > 70 and all_bullish:
            return 'put'
        return random.choice(['call', 'put'])

    return random.choice(['call', 'put'])

# Modelo LSTM com PyTorch
class LSTMModel(nn.Module):
    def __init__(self, input_size=4, hidden_size=64, num_layers=2):
        super(LSTMModel, self).__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_size, 1)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        out, _ = self.lstm(x, (h0, c0))
        out = self.fc(out[:, -1, :])
        out = self.sigmoid(out)
        return out

# Função corrigida para preparar dados
def prepare_data(velas, look_back=20):
    if not velas or len(velas) < look_back + 1:
        print(f"{yellow}Dados para análise (mínimo {look_back + 1} velas).")
        return None, None, None
    
    # Lista para armazenar os dados
    data = []
    required_keys = ['open', 'high', 'low', 'close']
    
    for vela in velas[-look_back-1:]:
        # Verifica se todas as chaves necessárias estão presentes
        if not all(key in vela for key in required_keys):
            print(f"{yellow}Dados incompletos para vela: {vela}. Pulando análise.")
            return None, None, None
        
        # Adiciona os valores ao array de dados
        data.append([vela['open'], vela['high'], vela['low'], vela['close']])
    
    # Converte para numpy array
    data = np.array(data)
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled_data = scaler.fit_transform(data)
    
    X = scaled_data[:-1].reshape(1, look_back, 4)
    y = 1 if data[-1, 3] > data[-2, 3] else 0  # 1 = call, 0 = put (baseado no close)
    return torch.FloatTensor(X), torch.FloatTensor([y]), scaler

def train_model(model, velas, look_back=20, epochs=50):
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    criterion = nn.BCELoss()
    
    historical_candles = API.get_candles(velas[0]['par'] if 'par' in velas[0] else melhor_par, 60, 200, time.time())
    if len(historical_candles) < look_back + 1:
        print(f"{yellow}Dados históricos insuficientes para treinamento.")
        return
    
    for epoch in range(epochs):
        total_loss = 0
        for i in range(len(historical_candles) - look_back - 1):
            X, y, _ = prepare_data(historical_candles[i:i+look_back+1])
            if X is None:
                continue
            
            optimizer.zero_grad()
            output = model(X)
            loss = criterion(output, y)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
        
        print(f"{white}Epoch {epoch+1}/{epochs}, Loss: {total_loss:.4f}")
    
    torch.save(model.state_dict(), 'lstm_model.pth')
    print(f"{green}Modelo salvo em 'lstm_model.pth'")

def load_model(input_size=4, hidden_size=64, num_layers=2):
    model = LSTMModel(input_size, hidden_size, num_layers)
    if os.path.exists('lstm_model.pth'):
        model.load_state_dict(torch.load('lstm_model.pth'))
        print(f"{green}Modelo carregado de 'lstm_model.pth'")
    else:
        print(f"{yellow}Nenhum modelo salvo encontrado. Treinando novo modelo...")
    model.eval()
    return model

# Função corrigida para predição
def predict_direction(model, velas, look_back=20):
    X, _, scaler = prepare_data(velas, look_back)
    if X is None:
        print(f"{yellow}Usando direção sugerida pela IA.")
        return random.choice(['call', 'put'])
    
    with torch.no_grad():
        pred = model(X)
        direcao = 'call' if pred.item() >= 0.5 else 'put'
        print(f"{white}Predição da IA: {direcao} (Probabilidade: {pred.item():.2f})")
    return direcao

lstm_model = load_model(input_size=4, hidden_size=64, num_layers=2)

def estrategia_LSTrader_Volatility_manual(ativo):
    global stop, timeframe, exp, tipo
    
    timeframe = 60
        
    valor_entrada = float(input(f'\n>> {green}Digite o valor que você deseja operar{white}: '))
    
    qnt_velas = 14  # Quantidade de velas para análise (ajustável para RSI)
    reversal_candles = 5  # Quantidade de velas para Reversão
    trend_threshold = 0.7  # Limiar para Tendência
    
    print(yellow + '***************************************************************************************')
    print("\n>>> Iniciando Logan Smith Trader Volatility Trial Mode Manual com IA (PyTorch LSTM)")
    
    # Escolher estratégia
    print(f"{green}\nEscolha a estratégia:")
    print(f"{green}1 - {white}Tendência (Trend)")
    print(f"{green}2 - {white}RSI")
    print(f"{green}3 - {white}Reversão")
    print(f"{green}4 - {white}RSI + Tendência")
    print(f"{green}5 - {white}RSI + Reversão")
    estrategia_num = int(input(f"{green}Digite o número da estratégia (1-5): "))
    
    if estrategia_num == 1:
        strategy = 'trend'
        trend_threshold = float(input(f"{green}Digite o limite de tendência (0 a 1, ex: 0.7 para 70%): "))
    elif estrategia_num == 2:
        strategy = 'rsi'
        trend_threshold = 0
    elif estrategia_num == 3:
        strategy = 'reversal'
        trend_threshold = 0
    elif estrategia_num == 4:
        strategy = 'rsi+trend'
        trend_threshold = float(input(f"{green}Digite o limite de tendência (0 a 1, ex: 0.7 para 70%): "))
    elif estrategia_num == 5:
        strategy = 'rsi+reversal'
        trend_threshold = 0
    else:
        print(f"{red}Estratégia inválida, usando Tendência por padrão")
        strategy = 'trend'
        trend_threshold = 0.7
    
    
    while stop:
        time.sleep(0.1)
        timestamp_atual = API.get_server_timestamp()
        h = datetime.fromtimestamp(timestamp_atual).strftime("%d/%m/%Y %H:%M:%S")
        minutos = float(datetime.fromtimestamp(timestamp_atual).strftime("%M.%S")[1:])
        segundos = int(datetime.fromtimestamp(timestamp_atual).strftime("%S"))
        
        # Ajustar a condição de entrada com base no timeframe
        entrar = segundos <= (timeframe - 30) or segundos == 0
        
        if entrar:
            print(">>> Aguardando análise", minutos, end="\r")
            direcao = False
            
            par = ativo
            print(yellow + '***************************************************************************************')
            print(f"\n>>> Analisando o ativo: {ativo}")
            
            try:
                velas = API.get_candles(ativo, timeframe, qnt_velas, time.time())
                if velas is None or len(velas) < qnt_velas:
                    print(f">>> Erro ao obter velas suficientes para o ativo {ativo}.")
                    continue
                
                direcao = predict_direction(lstm_model, velas)
                if segundos < (timeframe - 30):
                    wait_for_new_entry(API)
                    compra(ativo, valor_entrada, direcao, exp, tipo)
            except Exception as e:
                print(f">>> Erro ao processar o ativo {ativo}: {e}")
            
            print(yellow + '***************************************************************************************')
        else:
            print(">> Aguardando horário para entrada", minutos, end="\r")

def estrategia_LSTrader_Volatility_manual2(ativo):
    global stop, timeframe, exp, tipo_op
    
    timeframe = 60
        
    valor_entrada = float(input(f'\n>> {green}Digite o valor que você deseja operar{white}: '))
    
    qnt_velas = 14  # Quantidade de velas para análise (ajustável para RSI)
    reversal_candles = 5  # Quantidade de velas para Reversão
    trend_threshold = 0.7  # Limiar para Tendência
    
    print(yellow + '***************************************************************************************')
    print("\n>>> Iniciando Logan Smith Trader Volatility Trial Mode Manual com IA (PyTorch LSTM)")
    
    # Escolher estratégia
    print(f"{green}\nEscolha a estratégia:")
    print(f"{green}1 - {white}Tendência (Trend)")
    print(f"{green}2 - {white}RSI")
    print(f"{green}3 - {white}Reversão")
    print(f"{green}4 - {white}RSI + Tendência")
    print(f"{green}5 - {white}RSI + Reversão")
    estrategia_num = int(input(f"{green}Digite o número da estratégia (1-5): "))
    
    if estrategia_num == 1:
        strategy = 'trend'
        trend_threshold = float(input(f"{green}Digite o limite de tendência (0 a 1, ex: 0.7 para 70%): "))
    elif estrategia_num == 2:
        strategy = 'rsi'
        trend_threshold = 0
    elif estrategia_num == 3:
        strategy = 'reversal'
        trend_threshold = 0
    elif estrategia_num == 4:
        strategy = 'rsi+trend'
        trend_threshold = float(input(f"{green}Digite o limite de tendência (0 a 1, ex: 0.7 para 70%): "))
    elif estrategia_num == 5:
        strategy = 'rsi+reversal'
        trend_threshold = 0
    else:
        print(f"{red}Estratégia inválida, usando Tendência por padrão")
        strategy = 'trend'
        trend_threshold = 0.7

    
    while stop:
        time.sleep(0.1)
        timestamp_atual = API.get_server_timestamp()
        h = datetime.fromtimestamp(timestamp_atual).strftime("%d/%m/%Y %H:%M:%S")
        minutos = float(datetime.fromtimestamp(timestamp_atual).strftime("%M.%S")[1:])
        segundos = int(datetime.fromtimestamp(timestamp_atual).strftime("%S"))
        
        # Ajustar a condição de entrada com base no timeframe
        entrar = segundos <= (timeframe - 30) or segundos == 0
        
        if entrar:
            print(">>> Aguardando análise", minutos, end="\r")
            direcao = False
            
            ativo, tipo_op = escolher_par_manual() # ESCOLHA CONSTANTE DE ATIVOS. AO ENCERRAR A OPERAÇÃO, ESCOLHE OUTRO ATIVO PARA OPERAR
            if not ativo or not tipo_op:
                print(f"{red}Nenhum ativo disponível para operar!")
                continue
            
            par = ativo
            print(yellow + '***************************************************************************************')
            print(f"\n>>> Analisando o ativo: {ativo}")
            
            try:
                velas = API.get_candles(ativo, timeframe, qnt_velas, time.time())
                if velas is None or len(velas) < qnt_velas:
                    print(f">>> Erro ao obter velas suficientes para o ativo {ativo}.")
                    continue 
                  
                direcao = predict_direction(lstm_model, velas)
                if segundos < (timeframe - 30):
                    wait_for_new_entry(API)
                    compra(ativo, valor_entrada, direcao, exp, tipo_op)
            except Exception as e:
                print(f">>> Erro ao processar o ativo {ativo}: {e}")
            
            print(yellow + '***************************************************************************************')
        else:
            print(">> Aguardando horário para entrada", minutos, end="\r")
        

def estrategia_LSTrader_Volatility_automatico():
    global ativos, valor_entrada, tipo, timeframe, exp, melhor_par
    
    timeframe = 60

    qnt_velas = 14  # Quantidade de velas para análise (ajustável para RSI)
    reversal_candles = 5  # Quantidade de velas para Reversão
    trend_threshold = 0.7  # Limiar para Tendência
    
    print(yellow + '***************************************************************************************')
    print("\n>>> Iniciando Logan Smith Trader Volatility Trial Mode Manual com IA (PyTorch LSTM)")
    
    # Escolher estratégia
    print(f"{green}\nEscolha a estratégia:")
    print(f"{green}1 - {white}Tendência (Trend)")
    print(f"{green}2 - {white}RSI")
    print(f"{green}3 - {white}Reversão")
    print(f"{green}4 - {white}RSI + Tendência")
    print(f"{green}5 - {white}RSI + Reversão")
    estrategia_num = int(input(f"{green}Digite o número da estratégia (1-5): "))
    
    if estrategia_num == 1:
        strategy = 'trend'
        trend_threshold = float(input(f"{green}Digite o limite de tendência (0 a 1, ex: 0.7 para 70%): "))
    elif estrategia_num == 2:
        strategy = 'rsi'
        trend_threshold = 0
    elif estrategia_num == 3:
        strategy = 'reversal'
        trend_threshold = 0
    elif estrategia_num == 4:
        strategy = 'rsi+trend'
        trend_threshold = float(input(f"{green}Digite o limite de tendência (0 a 1, ex: 0.7 para 70%): "))
    elif estrategia_num == 5:
        strategy = 'rsi+reversal'
        trend_threshold = 0
    else:
        print(f"{red}Estratégia inválida, usando Tendência por padrão")
        strategy = 'trend'
        trend_threshold = 0.7
    
    
    while True:
        time.sleep(0.1)
        timestamp_atual = API.get_server_timestamp()
        h = datetime.fromtimestamp(timestamp_atual).strftime("%d/%m/%Y %H:%M:%S")
        minutos = float(datetime.fromtimestamp(timestamp_atual).strftime("%M.%S")[1:])
        segundos = int(datetime.fromtimestamp(timestamp_atual).strftime("%S"))
        
        # Ajustar a condição de entrada com base no timeframe
        entrar = segundos <= (timeframe - 30) or segundos == 0
        
        if entrar:
            print(">>> Aguardando análise", minutos, end="\r")
            direcao = False
            
            ativo, tipo_op = escolher_par_e_tipo_automatico(API, pay_minimo)
            if not ativo or not tipo_op:
                print(f"{red}Nenhum ativo disponível para operar!")
                continue
            
            melhor_par = ativo
            print(yellow + '***************************************************************************************')
            print(f"\n>>> Analisando o ativo: {melhor_par}")
            
            try:
                velas = API.get_candles(melhor_par, timeframe, qnt_velas + 180, time.time())
                if not os.path.exists('lstm_model.pth'):
                    train_model(lstm_model, velas)
                else:
                    lstm_model.train()
                velas = velas[-qnt_velas:]
                if velas is None or len(velas) < qnt_velas:
                    print(f">>> Erro ao obter velas suficientes para o ativo {melhor_par}.")
                    continue
                
                direcao = predict_direction(lstm_model, velas)
                if segundos < (timeframe - 30):
                    wait_for_new_entry(API)
                    compra(melhor_par, valor_entrada, direcao, exp, tipo_op)
            except Exception as e:
                print(f">>> Erro ao processar o ativo {melhor_par}: {e}")
            
            print(yellow + '***************************************************************************************')
        else:
            print(">> Aguardando horário para entrada", minutos, end="\r")

def catag(all_asset, API):
    global analise_result, pares_abertos
    quantidade_catalogacao = 21
    payout = 80
    payout = float((payout)/100)
    conf = ConfigObj("config.txt", encoding='UTF-8', list_values=False) 
    if conf['MARTINGALE']['usar_martingale'] == 'S':
        if int(conf['MARTINGALE']['niveis_martingale']) == 0:
            linha = 2
        if int(conf['MARTINGALE']['niveis_martingale']) == 1:
            linha = 3
        if int(conf['MARTINGALE']['niveis_martingale']) >= 2:
            linha = 4
        if int(conf['MARTINGALE']['niveis_martingale']) == 3:
            linha = 5
        if int(conf['MARTINGALE']['niveis_martingale']) == 4:
            linha = 6
        if int(conf['MARTINGALE']['niveis_martingale']) >= 5:
            linha = 7
        if int(conf['MARTINGALE']['niveis_martingale']) >= 6:
            linha = 8
        if int(conf['MARTINGALE']['niveis_martingale']) >= 7:
            linha = 9
        if int(conf['MARTINGALE']['niveis_martingale']) >= 8:
            linha = 10
        if int(conf['MARTINGALE']['niveis_martingale']) >= 9:
            linha = 11
        if int(conf['MARTINGALE']['niveis_martingale']) >= 10:
            linha = 12     
        martingale = int(conf['MARTINGALE']['niveis_martingale'])
    else:
        linha = 2
        martingale = 0

    pares_abertos = []
    pares_abertos_turbo = []
    pares_abertos_digital = []
    pares_abertos_binary = []

    if all_asset == "":
        all_asset = API.get_all_open_time()

    for par in all_asset["digital"]:
        if all_asset["digital"][par]["open"] == True:
            if par in ACTIVES:
                digital_payout = API.get_digital_payout(par)
                if digital_payout >= pay_minimo:
                    pares_abertos.append(par)
                    pares_abertos_digital.append(par)

    for par in all_asset["turbo"]:
        if all_asset["turbo"][par]["open"] == True:
            if par in ACTIVES:
                turbo_payout = round(profit[par]["turbo"], 2) * 100
                if turbo_payout >= pay_minimo:
                    if par not in pares_abertos:
                        pares_abertos.append(par)
                        pares_abertos_turbo.append(par)

    for par in all_asset["binary"]:
        if all_asset["binary"][par]["open"] == True:
            if par in ACTIVES:
                binary_payout = round(profit[par]["binary"], 2) * 100
                if binary_payout >= pay_minimo:
                    if par not in pares_abertos:
                        pares_abertos.append(par)
                        pares_abertos_binary.append(par)

    if "NZDUSD" in pares_abertos_binary:
        pares_abertos_binary.remove("NZDUSD")
    if "NZDUSD" in pares_abertos:
        pares_abertos.remove("NZDUSD")
    if "USOUSD" in pares_abertos:
        pares_abertos.remove("USOUSD")
    if "USDCHF" in pares_abertos:
        pares_abertos.remove("USDCHF")
    if "XAUUSD" in pares_abertos:
        pares_abertos.remove("XAUUSD")
    if "USDCHF" in pares_abertos:
        pares_abertos.remove("USDCHF")

    if "NZDUSD" in pares_abertos_digital:
        pares_abertos_digital.remove("NZDUSD")
    if "USOUSD" in pares_abertos_digital:
        pares_abertos_digital.remove("USOUSD")
    if "USDCHF" in pares_abertos_digital:
        pares_abertos_digital.remove("USDCHF")
    if "XAUUSD" in pares_abertos_digital:
        pares_abertos_digital.remove("XAUUSD")
    if "USDCHF" in pares_abertos_digital:
        pares_abertos_digital.remove("USDCHF")

    def convert(x):
        x1 = datetime.fromtimestamp(x)
        return x1.strftime('%H:%M')

    hora = API.get_server_timestamp()
    vela = {}
    for par in pares_abertos:
        vela[par] = {}
        data = API.get_candles(par, 60, 1000, hora)
        vela[par] = data

    def calcula_resultado(par, nome_estrategia, dicio):
        global analise_result
        dici = dicio
        win = dici['win']
        gale1 = dici['g1']
        gale2 = dici['g2']
        gale3 = dici['g3']
        gale4 = dici['g4']
        gale5 = dici['g5']
        gale6 = dici['g6']
        gale7 = dici['g7']
        gale8 = dici['g8']
        gale9 = dici['g9']
        gale10 = dici['g10']
        loss = dici['loss']
        
        todasentradas = win + gale1 + gale2 + gale3 + gale4 + gale5 + gale6 + gale7 + gale8 + gale9 + gale10 + loss
      
        win = win
        qnt_gale1 = win + gale1
        qnt_gale2 = win + gale1 + gale2
        qnt_gale3 = win + gale1 + gale2 + gale3
        qnt_gale4 = win + gale1 + gale2 + gale3 + gale4
        qnt_gale5 = win + gale1 + gale2 + gale3 + gale4 + gale5
        qnt_gale6 = win + gale1 + gale2 + gale3 + gale4 + gale5 + gale6
        qnt_gale7 = win + gale1 + gale2 + gale3 + gale4 + gale5 + gale6 + gale7
        qnt_gale8 = win + gale1 + gale2 + gale3 + gale4 + gale5 + gale6 + gale7 + gale8
        qnt_gale9 = win + gale1 + gale2 + gale3 + gale4 + gale5 + gale6 + gale7 + gale8 + gale9
        qnt_gale10 = win + gale1 + gale2 + gale3 + gale4 + gale5 + gale6 + gale7 + gale8 + gale9 + gale10

        if todasentradas != 0:
            assert_win = round(win/todasentradas*100, 2)
            assert_gale1 = round(qnt_gale1/todasentradas*100, 2)
            assert_gale2 = round(qnt_gale2/todasentradas*100, 2)
            assert_gale3 = round(qnt_gale3/todasentradas*100, 2)
            assert_gale4 = round(qnt_gale4/todasentradas*100, 2)
            assert_gale5 = round(qnt_gale5/todasentradas*100, 2)
            assert_gale6 = round(qnt_gale6/todasentradas*100, 2)
            assert_gale7 = round(qnt_gale7/todasentradas*100, 2)
            assert_gale8 = round(qnt_gale8/todasentradas*100, 2)
            assert_gale9 = round(qnt_gale9/todasentradas*100, 2)
            assert_gale10 = round(qnt_gale10/todasentradas*100, 2)
        
        analise_result.append([nome_estrategia]+[par]+[assert_win]+[assert_gale1]+[assert_gale2]+[assert_gale3]+[assert_gale4]+[assert_gale5]+[assert_gale6]+[assert_gale7]+[assert_gale8]+[assert_gale9]+[assert_gale10])

    def contabiliza_resultado(dir, entrada, entradamax, dici_result):
        numero = 0
        while True:
            if dir == entrada[str(numero+1)]:
                if numero == 0:
                    dici_result['win'] += 1
                    break
                elif numero == 1:
                    dici_result['g1'] += 1
                    break
                elif numero == 2:
                    dici_result['g2'] += 1
                    break
                elif numero == 3:
                    dici_result['g3'] += 1
                    break
                elif numero == 4:
                    dici_result['g4'] += 1
                    break
                elif numero == 5:
                    dici_result['g5'] += 1
                    break
                elif numero == 6:
                    dici_result['g6'] += 1
                    break
                elif numero == 7:
                    dici_result['g7'] += 1
                    break
                elif numero == 8:
                    dici_result['g8'] += 1
                    break
                elif numero == 9:
                    dici_result['g9'] += 1
                    break
                elif numero == 10:
                    dici_result['g10'] += 1
                    break
            else:
                if martingale >= 2:
                    if numero == 2:
                        dici_result['loss'] += 1
                        break
            numero += 1
            if martingale >= 2:
                if numero >= 3:
                    break
        return dici_result                       

    def volatil(vela):
        total = vela
        for par in pares_abertos:
            velas = total[par]
            velas.reverse()
            qnt_entrada = 0
            dici_result = {}
            dici_result['win'] = 0
            dici_result['g1'] = 0
            dici_result['g2'] = 0
            dici_result['g3'] = 0
            dici_result['g4'] = 0
            dici_result['g5'] = 0
            dici_result['g6'] = 0
            dici_result['g7'] = 0
            dici_result['g8'] = 0
            dici_result['g9'] = 0
            dici_result['g10'] = 0
            dici_result['loss'] = 0
            entrada = {}
            doji = 0
            
            for i in range(len(velas)):
                minutos = float(datetime.fromtimestamp(velas[i]['from']).strftime('%M')[1:])
                if minutos == 7 or minutos == 2:
                    try:
                        if i < 2:
                            pass
                        else:
                            vela1 = 'Verde' if velas[i+5]['open'] < velas[i+5]['close'] else 'Vermelha' if velas[i+5]['open'] > velas[i+5]['close'] else 'Doji'
                            vela2 = 'Verde' if velas[i+4]['open'] < velas[i+4]['close'] else 'Vermelha' if velas[i+4]['open'] > velas[i+4]['close'] else 'Doji'
                            vela3 = 'Verde' if velas[i+3]['open'] < velas[i+3]['close'] else 'Vermelha' if velas[i+3]['open'] > velas[i+3]['close'] else 'Doji'

                            entrada['1'] = 'Verde' if velas[i]['open'] < velas[i]['close'] else 'Vermelha' if velas[i]['open'] > velas[i]['close'] else 'Doji'
                            entrada['2'] = 'Verde' if velas[i-1]['open'] < velas[i-1]['close'] else 'Vermelha' if velas[i-1]['open'] > velas[i-1]['close'] else 'Doji'
                            entrada['3'] = 'Verde' if velas[i-2]['open'] < velas[i-2]['close'] else 'Vermelha' if velas[i-2]['open'] > velas[i-2]['close'] else 'Doji'
                            entrada['4'] = 'Verde' if velas[i-3]['open'] < velas[i-3]['close'] else 'Vermelha' if velas[i-3]['open'] > velas[i-3]['close'] else 'Doji'
                            entrada['5'] = 'Verde' if velas[i-4]['open'] < velas[i-4]['close'] else 'Vermelha' if velas[i-4]['open'] > velas[i-4]['close'] else 'Doji'
                            entrada['6'] = 'Verde' if velas[i-5]['open'] < velas[i-5]['close'] else 'Vermelha' if velas[i-5]['open'] > velas[i-5]['close'] else 'Doji'
                            entrada['7'] = 'Verde' if velas[i-6]['open'] < velas[i-6]['close'] else 'Vermelha' if velas[i-6]['open'] > velas[i-6]['close'] else 'Doji'
                            entrada['8'] = 'Verde' if velas[i-7]['open'] < velas[i-7]['close'] else 'Vermelha' if velas[i-7]['open'] > velas[i-7]['close'] else 'Doji'
                            entrada['9'] = 'Verde' if velas[i-8]['open'] < velas[i-8]['close'] else 'Vermelha' if velas[i-8]['open'] > velas[i-8]['close'] else 'Doji'
                            entrada['10'] = 'Verde' if velas[i-9]['open'] < velas[i-9]['close'] else 'Vermelha' if velas[i-9]['open'] > velas[i-9]['close'] else 'Doji'
                            entrada['11'] = 'Verde' if velas[i-10]['open'] < velas[i-10]['close'] else 'Vermelha' if velas[i-10]['open'] > velas[i-10]['close'] else 'Doji'

                            entradamax = 'Verde' if velas[i-martingale]['open'] < velas[i-martingale]['close'] else 'Vermelha' if velas[i-martingale]['open'] > velas[i-martingale]['close'] else 'Doji'
                            cores = vela1, vela2, vela3

                            if cores.count('Verde') > cores.count('Vermelha') and cores.count('Doji') == 0:
                                dir = 'Verde'
                            elif cores.count('Vermelha') > cores.count('Verde') and cores.count('Doji') == 0:
                                dir = 'Vermelha'
                            if cores.count('Doji') > 0:
                                doji += 1
                            else:
                                qnt_entrada += 1
                                dici_result = contabiliza_resultado(dir, entrada, entradamax, dici_result)
                    except:
                        pass
                if qnt_entrada == quantidade_catalogacao:
                    break 
            calcula_resultado(par, 'VOLATILIDADE', dici_result)

    analise_result = []
    volatil(vela)
    
    if conf['MARTINGALE']['usar_martingale'] == 'S':
        if martingale <= 1:
            ordenacao = 'gale1'
            linha = 3
        if martingale == 2:
            ordenacao = 'gale2'
            linha = 4
        if martingale == 3:
            ordenacao = 'gale3'
            linha = 5
        if martingale > 4:
            ordenacao = 'gale4'
            linha = 6
        if martingale > 5:
            ordenacao = 'gale5'
            linha = 7
        if martingale > 6:
            ordenacao = 'gale6'
            linha = 8
        if martingale > 7:
            ordenacao = 'gale7'
            linha = 9
        if martingale > 8:
            ordenacao = 'gale8'
            linha = 10
        if martingale > 9:
            ordenacao = 'gale9'
            linha = 11
        if martingale > 10:
            ordenacao = 'gale10'
            linha = 12                        
    else:
        ordenacao = 'win'
        linha = 2

    listaordenada = sorted(analise_result, key=lambda x: x[linha], reverse=True)
    return listaordenada, linha

perfil = json.loads(json.dumps(API.get_profile_ansyc()))
cifrao = str(perfil['currency_char'])
nome = str(perfil['name'])

valorconta = float(API.get_balance())

while True:
    stop_win_input = input(Fore.GREEN + '\n>>' + Fore.WHITE + ' Digite o valor do STOP WIN (ex.: 50.0): ')
    try:
        stop_win = float(stop_win_input)
        if stop_win >= 0:
            print(Fore.GREEN + f'\n>> STOP WIN definido como {cifrao} {stop_win:.2f}')
            break
        else:
            print(Fore.RED + '>> Valor inválido - Digite um número maior ou igual a 0')
    except ValueError:
        print(Fore.RED + '>> Opção inválida - Digite um número válido (ex.: 50 ou 50.0)')

while True:
    stop_loss_input = input(Fore.GREEN + '\n>>' + Fore.WHITE + ' Digite o valor do STOP LOSS (ex.: 50.0): ')
    try:
        stop_loss = float(stop_loss_input)
        if stop_loss >= 0:
            print(Fore.GREEN + f'\n>> STOP LOSS definido como {cifrao} {stop_loss:.2f}')
            break
        else:
            print(Fore.RED + '>> Valor inválido - Digite um número maior ou igual a 0')
    except ValueError:
        print(Fore.RED + '>> Opção inválida - Digite um número válido (ex.: 50 ou 50.0)')

print(yellow +'\n''***************************************************************************************')
print(green +'>>'+white+'  Logan Smith Trader -  Robô Volatility Trial Mode & 5 Estratégias Avançadas') 
print(green +'>>'+white+'  Olá, ',nome, ' Seja bem vindo.')
print(green +'>>'+white+'  Seu Saldo na conta ',escolha, 'é de', cifrao,round(valorconta,2))
print(green +'>>'+white+'  Seu valor de entrada é de ',cifrao,round(valor_entrada,2))
print(green +'>>'+white+'  Stop win:',cifrao,round(stop_win,2))
print(green +'>>'+white+'  Stop loss:',cifrao,'-',round(stop_loss,2))
print(yellow + '***************************************************************************************')

def verifica_payouts(par):
    if tipo == 'automatico':
        if float(payouts_total['digital'][str(par)]) == 0 and float(payouts_total['turbo'][str(par)]) == 0:
            stat = False
            tipo_op = 'FECHADO'
        elif float(payouts_total['digital'][str(par)]) > float(payouts_total['turbo'][str(par)]):
            if float(payouts_total['digital'][str(par)]) >= pay_minimo:
                tipo_op = 'digital'
                stat = True
            else: 
                tipo_op = 'abaixo'
                stat = False
        else:
            if float(payouts_total['turbo'][str(par)]) >= pay_minimo:
                tipo_op = 'binary'
                stat = True
            else: 
                tipo_op = 'abaixo'
                stat = False
    else:
        if tipo == 'binaria':
            tipo_op = 'binary'
            stat = True
        elif tipo == 'digital':
            stat = True
            tipo_op = 'digital'
        try:
            if float(payouts_total['digital'][str(par)]) == 0 and float(payouts_total['turbo'][str(par)]) == 0:
                tipo_op = 'FECHADO'
                stat = False
        except:
            tipo_op = 'binary'
            stat = True
    return stat, tipo_op

def payouts():
    global payouts_total, all_asset, profit, pares_abertos
    print(yellow+'>> Puxando pares abertos e payouts...')
    payouts_total = {}
    pares_abertos = []
    profit = API.get_all_profit()
    all_asset = API.get_all_open_time()
    payouts_total['turbo'] = {}
    payouts_total['binary'] = {}
    payouts_total['digital'] = {}
    for par in all_asset['binary']:
        payouts_total['binary'][par] = 0
        payouts_total['turbo'][par] = 0
        payouts_total['digital'][par] = 0
    for par in all_asset['turbo']:
        payouts_total['binary'][par] = 0
        payouts_total['turbo'][par] = 0
        payouts_total['digital'][par] = 0
    for par in all_asset['digital']:
        payouts_total['binary'][par] = 0
        payouts_total['turbo'][par] = 0
        payouts_total['digital'][par] = 0

Thread(target=payouts).start()

def puxa_payouts():
    print('>> Puxando pares abertos        ',end = '\r')
    payouts_total = {}
    pares_abertos = []
    profit = API.get_all_profit()
    all_asset = API.get_all_open_time()
    novo = []
    payouts = []
    pares = []

    for par in all_asset['binary']:
        if all_asset['binary'][par]['open']:
            pares.append(par)

    for par in all_asset['turbo']:
        if all_asset['turbo'][par]['open']:
            if par not in pares:
                pares.append(par)
    for par in all_asset['digital']:
        if all_asset['digital'][par]['open']:
            if par not in pares:
                pares.append(par)

    for par in pares:
        print(f'>> Puxando payouts do par: {par}      ',end = '\r')
        try:
            if all_asset['binary'][par]['open']:
                bin  = round(profit[par]["binary"] * 100, 2)
            else: 
                bin = 0

            if all_asset['turbo'][par]['open']:
                turbo = round(profit[par]["turbo"] * 100 , 2)
            else:
                turbo = 0

            if all_asset['digital'][par]['open']: 
                digi = API.get_digital_payout(par)
            else:
                digi = 0

            payouts.append([par,bin,turbo,digi])
        except:
            pass
    print(tabulate(payouts,headers=['PAR','BINARY','TURBO','DIGITAL'], tablefmt="simple_grid", numalign="center"))
    
puxa_payouts()

def puxa_candles():
    print(f'>>> {green}PUXANDO ULTIMAS 5 VELAS DO PAR {white}{melhor_par}')
    velas = API.get_candles(melhor_par, 60, 5, time.time())
    hora0 = datetime.fromtimestamp(velas[-5]['from']).strftime('%H:%M')
    hora1 = datetime.fromtimestamp(velas[-4]['from']).strftime('%H:%M')
    hora2 = datetime.fromtimestamp(velas[-3]['from']).strftime('%H:%M')
    hora3 = datetime.fromtimestamp(velas[-2]['from']).strftime('%H:%M')
    hora4 = datetime.fromtimestamp(velas[-1]['from']).strftime('%H:%M')

    cores = []
    cores.append('Verde' if velas[-5]['open'] < velas[-5]['close'] else 'Vermelha' if velas[-5]['open'] > velas[-5]['close'] else 'Doji')
    cores.append('Verde' if velas[-4]['open'] < velas[-4]['close'] else 'Vermelha' if velas[-4]['open'] > velas[-4]['close'] else 'Doji')
    cores.append('Verde' if velas[-3]['open'] < velas[-3]['close'] else 'Vermelha' if velas[-3]['open'] > velas[-3]['close'] else 'Doji')
    cores.append('Verde' if velas[-2]['open'] < velas[-2]['close'] else 'Vermelha' if velas[-2]['open'] > velas[-2]['close'] else 'Doji')
    cores.append('Verde' if velas[-1]['open'] < velas[-1]['close'] else 'Vermelha' if velas[-1]['open'] > velas[-1]['close'] else 'Doji')

    def cor_vela(cor):
        if cor == 'Verde':
            return Back.GREEN + '       '
        elif cor == 'Vermelha':
            return Back.RED + '       '
        elif cor == 'Doji':
            return Back.WHITE + '       '

    print('\n')
    for _ in range(7):
        print('  ', cor_vela(cores[0]), ' ', cor_vela(cores[1]), ' ', cor_vela(cores[2]), ' ', cor_vela(cores[3]), ' ', cor_vela(cores[4]))

    print('   ', str(hora0), '   ', str(hora1), '   ', str(hora2), '   ', str(hora3), '   ', str(hora4))
    print('')
    return cores

def escolher_par_e_tipo_automatico(API, payout_minimo=70): 
    global tipos_disponiveis, melhor_par, tempo_restante, ativo
    all_assets = API.get_all_open_time() 
    all_profits = API.get_all_profit() 
    payouts = []
    pares = []
    all_asset = []
    
    ativos_excluidos = ["NZDUSD-op", "EURGBP-op", "GBPUSD-op", "BAIDU", "MORSTAN", "GS", "ALIBABA", "BTCUSD-op", "GBPJPY-op", "CADCHF-op", "EURAUD-op", 
                        "EURCAD-op", "EURCHF-op", "GBPCHF-op", "AUDNZD-op", "EURNZD-op", "AUDCHF-op", "INTEL-op", "ALIBABA-OTC", "MCDON-op", "AMAZON-op", "ARBUSD-OTC",
                        "Dollar_Index", "Yen_Index", "AUDUSD-op", "AUDJPY-op", "XRPUSD", "LTCUSD", "BTCUSD", "ETHUSD", "EOSUSD", "EURAUD", "GBPAUD-op", "GBPNZD-op", 
                        "NZDCAD-op", "NZDCAD-op", "NZDJPY-op", "AUDNZD-op", "CADCHF-op", "MCDON", "INTEL", "APLLE", "AMAZON", "BAIDU", "JPM", "NIKE", "AIG", "COKE", 
                        "USDJPY", "USDCAD", "GBPUSD", "AUDJPY", "CADCHF", "EURCHF", "AUDUSD", "USDCHF", "GBPJPY", "USDCHF-op", "AUDCAD-op", "NZDJPY-op", "AUDCHF-op", 
                        "GBPCAD-op", "GBPCAD-op", "EURNZD-op", "EURCAD-op", "GBPCHF-op", "MSFT", "TESLA", "GOOGLE", "META", "CITI", "CITI-OTC", "USDINR", "AIG-OTC",
                        "EURAUD", "AUDCHF", "AUDCAD", "EURGBP", "EURCAD", "EURUSD", "USDCAD-op", "USDJPY-OTC", "USDJPY", "USDJPY-op", "USSPX500:N", "USNDAQ100:N", "US30:N",
                        "NZDUSD-OTC", "AUDNZD-OTC", "AUDCAD-OTC", "EURJPY-OTC", "GBPJPY-OTC", "EURGBP-OTC", "GBPUSD-OTC", "USDJPY-OTC", "USDJPY", "NZDUSD", "GBPJPY", "GBPUSD", 
                        "EURAUD-op", "GBPAUD-op", "EURCHF-op", "GBPNZD-op", "AUDUSD-OTC", "AUDJPY-OTC", "SNAP-OTC"]
    
    ativos_disponiveis = {} 
    catalogacao_pares = [] 
    
    for ativo, info in all_assets['binary'].items():
        if ativo not in ativos_excluidos:
            if info['open']:
                payout_binario = all_profits.get(ativo, {}).get('binary', 0) * 100 
                if payout_binario >= payout_minimo:
                    ativos_disponiveis[ativo] = payout_binario 
                    if ativo not in ["NZDUSD-op", "EURGBP-op", "GBPUSD-op", "BAIDU", "MORSTAN", "GS", "ALIBABA", "BTCUSD-op", "GBPJPY-op", "CADCHF-op", "EURAUD-op", 
                                     "EURCAD-op", "EURCHF-op", "GBPCHF-op", "AUDNZD-op", "EURNZD-op", "AUDCHF-op", "INTEL-op", "ALIBABA-OTC", "MCDON-op", "AMAZON-op", "ARBUSD-OTC",
                                     "Dollar_Index", "Yen_Index", "AUDUSD-op", "AUDJPY-op", "XRPUSD", "LTCUSD", "BTCUSD", "ETHUSD", "EOSUSD", "EURAUD", "GBPAUD-op", "GBPNZD-op", 
                                     "NZDCAD-op", "NZDCAD-op", "NZDJPY-op", "AUDNZD-op", "CADCHF-op", "MCDON", "INTEL", "APLLE", "AMAZON", "BAIDU", "JPM", "NIKE", "AIG", "COKE", 
                                     "USDJPY", "USDCAD", "GBPUSD", "AUDJPY", "CADCHF", "EURCHF", "AUDUSD", "USDCHF", "GBPJPY", "USDCHF-op", "AUDCAD-op", "NZDJPY-op", "AUDCHF-op", 
                                     "GBPCAD-op", "GBPCAD-op", "EURNZD-op", "EURCAD-op", "GBPCHF-op", "MSFT", "TESLA", "GOOGLE", "META", "CITI", "CITI-OTC", "USDINR", "AIG-OTC",
                                     "EURAUD", "AUDCHF", "AUDCAD", "EURGBP", "EURCAD", "EURUSD", "USDCAD-op", "USDJPY-OTC", "USDJPY", "USDJPY-op", "USSPX500:N", "USNDAQ100:N", "US30:N",
                                     "NZDUSD-OTC", "AUDNZD-OTC", "AUDCAD-OTC", "EURJPY-OTC", "GBPJPY-OTC", "EURGBP-OTC", "GBPUSD-OTC", "USDJPY-OTC", "USDJPY", "NZDUSD", "GBPJPY", "GBPUSD", 
                                     "EURAUD-op", "GBPAUD-op", "EURCHF-op", "GBPNZD-op", "AUDUSD-OTC", "AUDJPY-OTC", "SNAP-OTC"]:
                        catalogacao_pares.append({ 
                            'Ativo': ativo, 
                            'Payout (%)': payout_binario, 
                            'Tempo Restante (s)': tempo_restante 
                        })  
         
    if ativos_disponiveis:
        print(f'>>> {green}Puxando pares abertos', end='\r')
        payouts = []
        pares = []

        for par in all_assets['binary']:
            if ativo not in par and all_assets['binary'][par]['open']:
                pares.append(par)

        for par in all_assets['digital']:
            if ativo not in par and all_assets['digital'][par]['open']:
                if par not in pares:
                    pares.append(par)

        for par in pares:
            print(f'>>> {green}Puxando payouts do par: {par}', end='\r')
            try:
                bin_payout = round(all_profits.get(par, {}).get("binary", 0) * 100, 2) if all_assets['binary'].get(par, {}).get('open') else 0
                digi_payout = API.get_digital_payout(par) if all_assets['digital'].get(par, {}).get('open') else 0

                payouts.append([par, bin_payout, digi_payout])
            except:
                pass

        print(tabulate(payouts, headers=['PAR', 'BINARY', 'DIGITAL'], tablefmt="double_grid", numalign="center"))
        
        df_catalogacao = pd.DataFrame(catalogacao_pares) 
        print(f"{green}Catalogação dos pares disponíveis:") 
        print(df_catalogacao)
         
        melhor_par = max(ativos_disponiveis, key=ativos_disponiveis.get) 
        print(yellow + '***************************************************************************************') 
        print(f"{green}Ativo escolhido: {melhor_par} {yellow}com payout de {ativos_disponiveis[melhor_par]:.2f}%") 
        print(yellow + '***************************************************************************************') 
        
        tipos_disponiveis = { 
            'binary': all_profits.get(melhor_par, {}).get('binary', 0) * 100 if all_assets['binary'].get(melhor_par, {}).get('open') else 0, 
            'digital': API.get_digital_payout(melhor_par) if all_assets['digital'].get(melhor_par, {}).get('open') else 0 
        } 
        
        tipos_validos = {k: v for k, v in tipos_disponiveis.items() if v >= payout_minimo} 
 
        if tipos_validos: 
            melhor_tipo = max(tipos_validos, key=tipos_validos.get) 
            print(f"{green}Tipo de negociação: {melhor_tipo.upper()} {yellow}com payout de {tipos_validos[melhor_tipo]:.2f}%") 
            return melhor_par, melhor_tipo 
        else: 
            print(f"{red}Nenhum tipo de negociação disponível para {melhor_par} {yellow}com payout mínimo de {payout_minimo}%.") 
            return melhor_par, None 
    else: 
        print(f"{red}Nenhum ativo disponível com {yellow}payout mínimo de {payout_minimo}%.") 
        return None, None

def wait_for_new_entry(API):
    while True:
        now = get_broker_time(API)
        next_entry = (now + timedelta(seconds=58 - now.second % 58)).replace(microsecond=0)

        while get_broker_time(API) < next_entry:
            current_time = get_broker_time(API)
            time_diff = (next_entry - current_time).total_seconds()
            print(f"\rAguardando a próxima entrada em {time_diff:.3f} segundos.", end="")
            time.sleep(0.01)

        print(f"\n{blue}Novo candle iniciado! {green}Entrando na operação.")
        break

def get_broker_time(API):
    server_timestamp = API.get_server_timestamp()
    broker_time = datetime.fromtimestamp(server_timestamp)
    return broker_time

mudar_automatico = True
ativo = ''
direcao = False
exp = 1

def main():
    global ativo, par, melhor_par, valor_entrada, direcao, exp, tipo
    print(yellow + '\n***************************************************************************************\n')
    estrategias = {
        1: ('MANUAL ', estrategia_LSTrader_Volatility_manual),
        2: ('MANUAL 2 ', estrategia_LSTrader_Volatility_manual2),
        3: ('AUTOMÁTICO ', estrategia_LSTrader_Volatility_automatico)
    }

    # Escolha do modo de operação
    modo_operacao = escolher_modo_operacao()
    
    while True:
        if modo_operacao == "manual":
            print(Fore.GREEN + '\n >> ' + Fore.WHITE + 'Modo manual selecionado')
            estrategia_LSTrader_Volatility_manual(ativo)  # Chama a função para operar manualmente no ativo escolhido
            break
        elif modo_operacao == "manual 2":
            print(Fore.GREEN + '\n >> ' + Fore.WHITE + 'Modo manual 2 selecionado')
            estrategia_LSTrader_Volatility_manual2(ativo)  # Chama a função para operar manualmente no ativo escolhido
            break
        else:
            print(Fore.GREEN + '\n >> ' + Fore.WHITE + 'Selecione a estratégia para operar:')
            for key, (nome, _) in estrategias.items():
                print(f"{Fore.GREEN}  {key} -  {Fore.BLUE if key % 3 == 0 else Fore.YELLOW}{nome}")
            try:
                estrateg = int(input(Fore.GREEN + ' --> '))
                if estrateg in estrategias:
                    nome, func = estrategias[estrateg]
                    mudar_automatico = False
                    print(f"Executando {nome}")

                    # Solicitar o valor de entrada
                    valor_entrada = float(input(f'\n>> {green}Digite o valor que você deseja operar{white}: '))

                    # Escolher o par e o tipo de operação automaticamente
                    ativos, tipo = escolher_par_e_tipo_automatico(API, payout_minimo=70)
                    if ativos and tipo:
                        func()  # Executa a estratégia automática
                        compra(ativo, valor_entrada, direcao, exp, tipo)  # Realiza a compra
                    else:
                        print("Não foi possível selecionar um ativo para operar.")
                    break
                else:
                    print(Fore.RED + '>> Opção inválida - Digite a opção 1 2 ou 3')
            except ValueError:
                print(Fore.RED + '>> Digite a opção válida (1 2 ou 3)')
            except Exception as e:
                print(Fore.RED + f'>> Erro ao executar estratégia: {e}')
                break

if __name__ == "__main__":
    try:
        Thread(target=verificar_conexao).start()
        main()
    except KeyboardInterrupt:
        print(f"{red}Bot interrompido pelo usuário")
        torch.save(lstm_model.state_dict(), 'lstm_model.pth')
        print(f"{green}Modelo salvo antes de encerrar")
        sys.exit()
    except Exception as e:
        print(f"{red}Erro: {str(e)}")
        torch.save(lstm_model.state_dict(), 'lstm_model.pth')
        print(f"{green}Modelo salvo antes de encerrar")
        sys.exit()