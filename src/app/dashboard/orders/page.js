import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const orders = [
  { id: '#1234', customer: 'John Doe', amount: '$250.00', status: 'Completed', date: '2024-01-15' },
  { id: '#1235', customer: 'Jane Smith', amount: '$180.00', status: 'Pending', date: '2024-01-14' },
  { id: '#1236', customer: 'Bob Johnson', amount: '$420.00', status: 'Completed', date: '2024-01-13' },
  { id: '#1237', customer: 'Alice Brown', amount: '$320.00', status: 'Processing', date: '2024-01-12' },
];

export default function OrdersPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
        <p className="text-muted-foreground">View and manage customer orders</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{order.id}</p>
                  <p className="text-sm text-muted-foreground">{order.customer}</p>
                  <p className="text-xs text-muted-foreground">{order.date}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-bold">{order.amount}</p>
                  <Badge variant={
                    order.status === 'Completed' ? 'default' :
                    order.status === 'Pending' ? 'secondary' :
                    'outline'
                  }>
                    {order.status}
                  </Badge>
                  <Button variant="ghost" size="sm">View</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}