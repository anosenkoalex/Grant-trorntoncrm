import { useState } from 'react';
import { Button, List, Spin, Typography, Upload, message } from 'antd';
import {
  DeleteOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  type AttachedFile,
  deleteAssignmentFile,
  downloadFile,
  fetchAssignmentFiles,
  uploadAssignmentFile,
} from '../api/client.js';

const getFileIcon = (mimetype: string) => {
  if (mimetype === 'application/pdf')
    return <FilePdfOutlined style={{ fontSize: 20, color: '#f5222d' }} />;
  if (mimetype.startsWith('image/'))
    return <FileImageOutlined style={{ fontSize: 20, color: '#52c41a' }} />;
  if (
    mimetype.includes('spreadsheet') ||
    mimetype.includes('excel') ||
    mimetype.includes('csv')
  )
    return <FileExcelOutlined style={{ fontSize: 20, color: '#1677ff' }} />;
  if (mimetype.includes('word') || mimetype.includes('document'))
    return <FileWordOutlined style={{ fontSize: 20, color: '#1677ff' }} />;
  return <FileOutlined style={{ fontSize: 20 }} />;
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

type Props = {
  assignmentId: string;
  canManage: boolean;
};

export const FileAttachment = ({ assignmentId, canManage }: Props) => {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: files = [], isLoading } = useQuery<AttachedFile[]>({
    queryKey: ['assignment-files', assignmentId],
    queryFn: () => fetchAssignmentFiles(assignmentId),
  });

  const deleteMutation = useMutation({
    mutationFn: (assignmentFileId: string) =>
      deleteAssignmentFile(assignmentId, assignmentFileId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['assignment-files', assignmentId] });
      void message.success('Файл удалён');
    },
    onError: () => void message.error('Не удалось удалить файл'),
  });

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      await uploadAssignmentFile(assignmentId, file);
      void qc.invalidateQueries({ queryKey: ['assignment-files', assignmentId] });
      void message.success('Файл загружен');
    } catch {
      void message.error('Не удалось загрузить файл');
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleDownload = async (file: AttachedFile) => {
    try {
      const blob = await downloadFile(file.fileId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      void message.error('Не удалось скачать файл');
    }
  };

  return (
    <div>
      {canManage && (
        <Upload.Dragger
          multiple={false}
          beforeUpload={(file) => {
            void handleUpload(file);
            return false;
          }}
          showUploadList={false}
          disabled={uploading}
          style={{ marginBottom: 16 }}
          accept="*/*"
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Перетащите файл или нажмите для загрузки</p>
          <p className="ant-upload-hint">Максимум 20 МБ</p>
        </Upload.Dragger>
      )}

      {uploading && (
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <Spin size="small" />
          <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
            Загрузка...
          </Typography.Text>
        </div>
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Spin />
        </div>
      ) : files.length === 0 ? (
        <Typography.Text type="secondary">Файлы не прикреплены</Typography.Text>
      ) : (
        <List
          size="small"
          dataSource={files}
          renderItem={(file) => (
            <List.Item
              actions={[
                <Button
                  key="download"
                  type="link"
                  icon={<DownloadOutlined />}
                  onClick={() => void handleDownload(file)}
                  size="small"
                  title="Скачать"
                />,
                canManage ? (
                  <Button
                    key="delete"
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    loading={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate(file.id)}
                    size="small"
                    title="Удалить"
                  />
                ) : null,
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={getFileIcon(file.mimetype)}
                title={
                  <Typography.Text
                    ellipsis={{ tooltip: file.originalName }}
                    style={{ maxWidth: 240 }}
                  >
                    {file.originalName}
                  </Typography.Text>
                }
                description={
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {formatSize(file.size)}
                  </Typography.Text>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );
};
