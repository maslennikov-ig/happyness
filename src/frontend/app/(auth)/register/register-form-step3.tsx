'use client';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerStep3Schema, type RegisterStep3FormValues } from '@/lib/validations/auth';
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
import { Checkbox } from '@/components/ui/checkbox';

interface RegisterFormStep3Props {
  onNext: (data: RegisterStep3FormValues) => void;
  onBack: () => void;
  defaultValues?: RegisterStep3FormValues;
  isLoading?: boolean;
}

export function RegisterFormStep3({
  onNext,
  onBack,
  defaultValues = {
    agreeToTerms: false,
  },
  isLoading = false,
}: RegisterFormStep3Props) {
  const form = useForm<RegisterStep3FormValues>({
    resolver: zodResolver(registerStep3Schema),
    defaultValues,
  });

  function onSubmit(data: RegisterStep3FormValues) {
    onNext(data);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Завершение регистрации</h1>
        <p className="text-sm text-muted-foreground">Шаг 3 из 3: Подтвердите условия</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="agreeToTerms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Я согласен с{' '}
                    <Link href="/terms" className="text-primary underline">
                      условиями использования
                    </Link>{' '}
                    и{' '}
                    <Link href="/privacy" className="text-primary underline">
                      политикой конфиденциальности
                    </Link>
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={onBack} disabled={isLoading}>
              Назад
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
