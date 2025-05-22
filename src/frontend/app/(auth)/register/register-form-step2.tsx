'use client';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerStep2Schema, type RegisterStep2FormValues } from '@/lib/validations/auth';

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

interface RegisterFormStep2Props {
  onNext: (data: RegisterStep2FormValues) => void;
  onBack: () => void;
  defaultValues?: RegisterStep2FormValues;
  isLoading?: boolean;
}

export function RegisterFormStep2({
  onNext,
  onBack,
  defaultValues = {
    firstName: '',
    lastName: '',
    phoneNumber: '',
  },
  isLoading = false,
}: RegisterFormStep2Props) {
  const form = useForm<RegisterStep2FormValues>({
    resolver: zodResolver(registerStep2Schema),
    defaultValues,
  });

  function onSubmit(data: RegisterStep2FormValues) {
    onNext(data);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Персональная информация</h1>
        <p className="text-sm text-muted-foreground">Шаг 2 из 3: Расскажите о себе</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Имя</FormLabel>
                <FormControl>
                  <Input placeholder="Иван" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Фамилия</FormLabel>
                <FormControl>
                  <Input placeholder="Иванов" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Номер телефона</FormLabel>
                <FormControl>
                  <Input placeholder="+7 (999) 123-45-67" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={onBack} disabled={isLoading}>
              Назад
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Загрузка...' : 'Далее'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
