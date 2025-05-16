'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

export default function UIDemoPage() {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Форма отправлена',
      description: `Имя: ${name}, Роль: ${role}`,
    });
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Демонстрация UI-компонентов</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Кнопки</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="default">Стандартная</Button>
            <Button variant="destructive">Деструктивная</Button>
            <Button variant="outline">Контурная</Button>
            <Button variant="secondary">Вторичная</Button>
            <Button variant="ghost">Призрачная</Button>
            <Button variant="link">Ссылка</Button>
          </div>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Размеры кнопок</h2>
          <div className="flex flex-wrap items-center gap-4">
            <Button size="sm">Маленькая</Button>
            <Button size="default">Стандартная</Button>
            <Button size="lg">Большая</Button>
            <Button size="icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </Button>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Карточки</h2>
          <Card>
            <CardHeader>
              <CardTitle>Заголовок карточки</CardTitle>
              <CardDescription>Описание карточки с дополнительной информацией</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Это основное содержимое карточки, здесь может быть любой контент.</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost">Отмена</Button>
              <Button>Сохранить</Button>
            </CardFooter>
          </Card>
        </section>
      </div>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Форма с компонентами</h2>
        <Card className="max-w-md mx-auto">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Профиль пользователя</CardTitle>
              <CardDescription>Заполните информацию о пользователе</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Имя</Label>
                <Input
                  id="name"
                  placeholder="Введите имя"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Роль</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Выберите роль" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Администратор</SelectItem>
                    <SelectItem value="manager">Менеджер</SelectItem>
                    <SelectItem value="user">Пользователь</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="submit" className="w-full">
                      Сохранить профиль
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Нажмите, чтобы сохранить изменения</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardFooter>
          </form>
        </Card>
      </section>

      <Toaster />
    </div>
  );
}
