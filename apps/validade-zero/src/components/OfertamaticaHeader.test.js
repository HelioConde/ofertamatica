import { fireEvent, render, screen } from '@testing-library/react';
import OfertamaticaHeader from './OfertamaticaHeader';

test('menu começa recolhido e expande com botão acessível', () => {
  render(<OfertamaticaHeader />);
  const nav = screen.getByRole('navigation', { name: 'Navegação principal do Ofertamática' });
  const open = screen.getByRole('button', { name: 'Abrir menu' });
  expect(open).toHaveAttribute('aria-controls', nav.id);
  expect(open).toHaveAttribute('aria-expanded', 'false');
  expect(nav).not.toHaveClass('is-open');

  fireEvent.click(open);
  expect(screen.getByRole('button', { name: 'Fechar menu' })).toHaveAttribute('aria-expanded', 'true');
  expect(nav).toHaveClass('is-open');
  expect(nav.querySelector('a[aria-current="page"]')).toHaveTextContent('Validade Zero');

  fireEvent.click(screen.getByRole('button', { name: 'Fechar menu' }));
  expect(nav).not.toHaveClass('is-open');
  expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveAttribute('aria-expanded', 'false');
});

test('Escape e clique fora fecham o menu, preservando a marca oficial', () => {
  render(<div><OfertamaticaHeader /><main data-testid="outside">Painel de estoque</main></div>);
  const nav = screen.getByRole('navigation', { name: 'Navegação principal do Ofertamática' });
  const brand = screen.getByRole('link', { name: /Ofertamática — voltar ao criador/i });
  expect(brand.querySelectorAll('img')).toHaveLength(1);
  expect(brand).toHaveTextContent('Validade Zero');

  fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(nav).not.toHaveClass('is-open');
  expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveFocus();

  fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));
  fireEvent.pointerDown(screen.getByTestId('outside'));
  expect(nav).not.toHaveClass('is-open');
});

test('todos os destinos aparecem no menu e selecionar um link fecha a lista', () => {
  render(<OfertamaticaHeader />);
  fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));
  const nav = screen.getByRole('navigation', { name: 'Navegação principal do Ofertamática' });
  expect(nav.querySelectorAll('a')).toHaveLength(7);
  expect(nav.querySelector('a[href="/validade-zero/"]')).toHaveAttribute('aria-current', 'page');
  fireEvent.click(nav.querySelector('a[href="/modelos/"]'));
  expect(nav).not.toHaveClass('is-open');
});
