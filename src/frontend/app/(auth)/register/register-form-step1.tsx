'use client';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerStep1Schema, type RegisterStep1FormValues } from '@/lib/validations/auth';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface RegisterFormStep1Props {
  onNext: (data: RegisterStep1FormValues) => void;
  defaultValues?: RegisterStep1FormValues;
  isLoading?: boolean;
}

export function RegisterFormStep1({
  onNext,
  defaultValues = {
    email: '',
    password: '',
    confirmPassword: '',
  },
  isLoading = false,
}: RegisterFormStep1Props) {
  const form = useForm<RegisterStep1FormValues>({
    resolver: zodResolver(registerStep1Schema),
    defaultValues,
  });

  function onSubmit(data: RegisterStep1FormValues) {
    onNext(data);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Создать аккаунт</h1>
        <p className="text-sm text-muted-foreground">Шаг 1 из 3: Основная информация</p>
      </div>
      <div className="flex justify-between text-sm">
        <p>Уже есть аккаунт?</p>
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Войти
        </Link>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="name@example.com"
                    {...field}
                    disabled={isLoading}
                    type="email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Пароль</FormLabel>
                <FormControl>
                  <Input placeholder="••••••••" {...field} disabled={isLoading} type="password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Подтверждение пароля</FormLabel>
                <FormControl>
                  <Input placeholder="••••••••" {...field} disabled={isLoading} type="password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Загрузка...' : 'Далее'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
