import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import { STORAGE_KEY } from './domain/validade';

beforeEach(() => window.localStorage.clear());

test('renders empty inventory and entry form', () => {
  render(<App />);
  expect(screen.getByText('Seu controle começa aqui')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Cadastrar primeiro lote/i }));
  expect(screen.getByRole('heading', { name: /Cadastrar novo lote/i })).toBeInTheDocument();
});

test('registers a lot and persists it locally', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /Cadastrar primeiro lote/i }));
  fireEvent.change(screen.getByPlaceholderText('Ex.: Leite integral 1 L'), { target: { value: 'Leite integral' } });
  fireEvent.change(screen.getByLabelText('EAN / código interno *'), { target: { value: '0789012345678' } });
  fireEvent.change(screen.getByPlaceholderText('Ex.: L-2026-001'), { target: { value: 'L01' } });
  fireEvent.change(screen.getByLabelText(/Data de validade/), { target: { value: '2030-01-01' } });
  fireEvent.click(screen.getByRole('button', { name: /Cadastrar lote/ }));
  expect(screen.getByText('Leite integral')).toBeInTheDocument();
  expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY))).toHaveLength(1);
});

test('describes invalid fields individually and focuses the first one', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /Cadastrar primeiro lote/i }));
  fireEvent.click(screen.getByRole('button', { name: 'Cadastrar lote' }));
  expect(screen.getByText(/Informe o nome do produto/)).toBeInTheDocument();
  expect(screen.getByText(/Informe o EAN ou código interno numérico/)).toBeInTheDocument();
  expect(screen.getByText(/Informe o lote do produto/)).toBeInTheDocument();
  expect(screen.getByText(/Informe uma data de validade válida/)).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: /Nome do produto/ })).toHaveFocus();
});

test('EAN obrigatório: não salva lote sem código e rejeita letras', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /Cadastrar primeiro lote/i }));
  fireEvent.change(screen.getByLabelText('Nome do produto *'), { target: { value: 'BISCOITO' } });
  fireEvent.change(screen.getByLabelText('Lote *'), { target: { value: 'L-001' } });
  fireEvent.change(screen.getByLabelText('Data de validade *'), { target: { value: '2030-12-31' } });
  fireEvent.click(screen.getByRole('button', { name: 'Cadastrar lote' }));
  expect(screen.getByText(/Informe o EAN ou código interno numérico/)).toBeInTheDocument();
  expect(screen.getByLabelText('EAN / código interno *')).toHaveFocus();
  expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();

  fireEvent.change(screen.getByLabelText('EAN / código interno *'), { target: { value: 'EAN-INVALIDO' } });
  fireEvent.click(screen.getByRole('button', { name: 'Cadastrar lote' }));
  expect(screen.getByText(/Informe o EAN ou código interno numérico/)).toBeInTheDocument();
  expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();

  fireEvent.change(screen.getByLabelText('EAN / código interno *'), { target: { value: '0789012345678' } });
  fireEvent.click(screen.getByRole('button', { name: 'Cadastrar lote' }));
  expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY))[0].code).toBe('0789012345678');
});

test('os dois campos exibem controle de câmera próximo ao input', () => {
  render(<App />);
  expect(screen.getByLabelText('Código EAN / código interno').parentElement.querySelector('.ean-input-camera')).not.toBeNull();
  expect(screen.getByRole('button', { name: 'Escanear EAN com a câmera' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Cadastrar primeiro lote/i }));
  expect(screen.getByLabelText('EAN / código interno *').parentElement.querySelector('.ean-input-camera')).not.toBeNull();
  expect(screen.getByRole('button', { name: 'Escanear EAN do lote com a câmera' })).toBeInTheDocument();
});


test('a câmera OCR fica dentro do input de validade e pode ser fechada', () => {
  render(<App/>);
  fireEvent.click(screen.getByRole('button', { name: /Cadastrar primeiro lote/ }));
  const input = screen.getByLabelText('Data de validade *');
  expect(input.parentElement.className).toContain('expiry-input-wrap');
  const button = screen.getByRole('button', {name:'Ler validade pela câmera'});
  expect(button).toHaveAttribute('aria-expanded', 'false');
  fireEvent.click(button);
  expect(screen.getByRole('region', {name:'Reconhecimento da validade'})).toBeInTheDocument();
  expect(button).toHaveAttribute('aria-expanded', 'true');
  fireEvent.click(screen.getByRole('button', {name:'Fechar leitor de validade'}));
  expect(screen.queryByRole('region', {name:'Reconhecimento da validade'})).not.toBeInTheDocument();
  expect(button).toHaveAttribute('aria-expanded', 'false');
});

test('usa uma única marca do Ofertamática no painel, sem logo repetida na sidebar', () => {
  render(<App />);
  const brand = screen.getByRole('link', { name: /Ofertamática — voltar ao criador/i });
  expect(brand).toHaveAttribute('href', '/');
  expect(brand.querySelector('.vz-site-product')).toHaveTextContent('Validade Zero');
  expect(document.querySelectorAll('.vz-site-header .vz-site-brand-icon')).toHaveLength(1);
  expect(document.querySelector('.sidebar .brand')).toBeNull();
  expect(document.querySelector('.sidebar .ecosystem-link')).toBeNull();
  expect(document.querySelector('.vz-site-tool')).toBeNull();
  expect(screen.getByRole('button', { name: /Cadastrar primeiro lote/i })).toBeInTheDocument();
});

test('mantém navbar e logo do Ofertamática acima do dashboard local', () => {
  render(<App />);
  const header = document.querySelector('.vz-site-header');
  const brand = screen.getByRole('link', { name: /Ofertamática — voltar ao criador/i });
  expect(header).toContainElement(brand);
  expect(brand.querySelector('img')).toHaveAttribute('src', '/icons/icon-192.png?v=20261008b');
  const nav = screen.getByRole('navigation', { name: 'Navegação principal do Ofertamática' });
  for (const label of ['Criar placas', 'Modelos', 'Editor livre', 'Formatos', 'Como funciona', 'Guias para varejo']) {
    expect(nav).toHaveTextContent(label);
  }
  expect(brand.querySelector('.vz-site-product')).toHaveTextContent('Validade Zero');
  expect(screen.getByText('Seu controle começa aqui')).toBeInTheDocument();
});
